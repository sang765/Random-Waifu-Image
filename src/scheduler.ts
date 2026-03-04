/**
 * Scheduler for running periodic waifu posts using node-cron
 *
 * This script runs continuously and posts images according to the CRON_SCHEDULE
 * defined in the .env file (default: every 6 hours)
 */

import cron from 'node-cron';
import { config, getRandomTags, loadDanbooruCredentials, loadRule34Credentials, loadR34DisableAiPost } from './utils/config';
import { waifuClient } from './clients/waifu-client';
import { nekosClient } from './clients/nekos-client';
import { waifuPicsClient } from './clients/waifu-pics-client';
import { picreClient } from './clients/picre-client';
import { nekosBestClient } from './clients/nekos-best-client';
import { initializeDanbooruClient, danbooruClient } from './clients/danbooru-client';
import { initializeRule34Client, rule34Client } from './clients/rule34-client';
import { DiscordWebhookClient } from './clients/discord-webhook';
import { WaifuSource, SourceType, SourceImage } from './types/source';

// Initialize Danbooru client with credentials if available
const danbooruCredentials = loadDanbooruCredentials();
if (danbooruCredentials) {
  initializeDanbooruClient(danbooruCredentials);
  console.log('🔑 Danbooru credentials loaded');
}

// Initialize Rule 34 client with credentials if available
const rule34Credentials = loadRule34Credentials();
const r34DisableAiPost = loadR34DisableAiPost();
if (rule34Credentials) {
  initializeRule34Client(rule34Credentials, r34DisableAiPost);
  console.log('🔑 Rule 34 credentials loaded');
  if (r34DisableAiPost) {
    console.log('🤖 Rule 34 AI filtering enabled (AI-generated images will be skipped)');
  }
}

/**
 * Get the image source based on configuration
 * If 'both' or 'random' is set, randomly select one from all available sources
 */
function getImageSource(sourceType: SourceType): WaifuSource {
  if (sourceType === 'both' || sourceType === 'random') {
    // Randomly select one of the sources
    const sources: WaifuSource[] = [waifuClient, nekosClient, waifuPicsClient, picreClient, nekosBestClient];
    // Add Danbooru if initialized with credentials
    if (danbooruClient) {
      sources.push(danbooruClient);
    }
    // Add Rule 34 if initialized with credentials
    if (rule34Client) {
      sources.push(rule34Client);
    }
    const randomIndex = Math.floor(Math.random() * sources.length);
    return sources[randomIndex];
  }

  if (sourceType === 'nekosapi') return nekosClient;
  if (sourceType === 'waifu.pics') return waifuPicsClient;
  if (sourceType === 'pic.re') return picreClient;
  if (sourceType === 'nekos.best') return nekosBestClient;
  if (sourceType === 'danbooru') {
    if (!danbooruClient) {
      throw new Error('Danbooru source selected but no credentials configured. Please set DANBOORU_USERNAME and DANBOORU_API_KEY in your .env file.');
    }
    return danbooruClient;
  }
  if (sourceType === 'rule34') {
    if (!rule34Client) {
      throw new Error('Rule 34 source selected but no credentials configured. Please set RULE34_USER_ID and RULE34_API_KEY in your .env file.');
    }
    return rule34Client;
  }
  return waifuClient;
}

/**
 * Get a fallback source (randomly select from all sources except the failed one)
 */
function getFallbackSource(excludeSource: WaifuSource): WaifuSource {
  const sources: WaifuSource[] = [waifuClient, nekosClient, waifuPicsClient, picreClient, nekosBestClient];
  // Add Danbooru to fallback if initialized
  if (danbooruClient) {
    sources.push(danbooruClient);
  }
  // Add Rule 34 to fallback if initialized
  if (rule34Client) {
    sources.push(rule34Client);
  }
  const filteredSources = sources.filter(s => s.name !== excludeSource.name);
  const randomIndex = Math.floor(Math.random() * filteredSources.length);
  return filteredSources[randomIndex];
}

/**
 * Fetch image with fallback mechanism
 * If the primary source fails (timeout, rate limit, etc.), try another source
 */
async function fetchImageWithFallback(
  type: 'sfw' | 'nsfw',
  primarySource: WaifuSource,
  tags: string[],
  maxRetries: number = 2
): Promise<{ image: SourceImage | null; sourceName: string }> {
  let currentSource = primarySource;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📥 Attempt ${attempt + 1}: Fetching ${type.toUpperCase()} image from ${currentSource.name}...`);
      
      const image = type === 'sfw' 
        ? await currentSource.fetchRandomSfw(tags)
        : await currentSource.fetchRandomNsfw(tags);
      
      if (image) {
        return { image, sourceName: currentSource.name };
      }
      
      // No image found, try fallback if not last attempt
      if (attempt < maxRetries) {
        console.log(`⚠️  No ${type.toUpperCase()} image from ${currentSource.name}, trying fallback...`);
        currentSource = getFallbackSource(currentSource);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️  ${currentSource.name} failed: ${lastError.message}`);
      
      // Try fallback if not last attempt
      if (attempt < maxRetries) {
        currentSource = getFallbackSource(currentSource);
        console.log(`🔄 Falling back to ${currentSource.name}...`);
      }
    }
  }

  // All retries exhausted
  if (lastError) {
    console.error(`❌ All sources failed. Last error: ${lastError.message}`);
  }
  
  return { image: null, sourceName: primarySource.name };
}

/**
 * Post waifu images to Discord
 */
async function scheduledPost(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Running scheduled post...`);

  try {
    const sourceType = config.imageSource;
    const source = getImageSource(sourceType);
    console.log(`📡 Using image source: ${source.name}`);

    // Post SFW image
    if (config.postSfw && config.sfwWebhookUrl) {
      const sfwTags = config.defaultTags.length > 0
        ? config.defaultTags
        : getRandomTags('sfw', 1, sourceType);
      console.log(`🏷️  SFW Tags: ${sfwTags.join(', ')}`);
      
      const { image: sfwImage, sourceName: sfwSourceName } = await fetchImageWithFallback('sfw', source, sfwTags);
      
      if (sfwImage) {
        const client = new DiscordWebhookClient(config.sfwWebhookUrl);
        await client.sendWaifuImage(sfwImage, { sourceName: sfwSourceName });
        console.log(`✅ Posted SFW image from ${sfwSourceName}: ${sfwImage.url}`);
      } else {
        console.warn('⚠️  No SFW image found from any source');
      }
    }

    // Post NSFW image
    if (config.postNsfw && config.nsfwWebhookUrl) {
      const nsfwTags = config.defaultTags.length > 0
        ? config.defaultTags
        : getRandomTags('nsfw', 1, sourceType);
      console.log(`🏷️  NSFW Tags: ${nsfwTags.join(', ')}`);
      
      const { image: nsfwImage, sourceName: nsfwSourceName } = await fetchImageWithFallback('nsfw', source, nsfwTags);
      
      if (nsfwImage) {
        const client = new DiscordWebhookClient(config.nsfwWebhookUrl);
        await client.sendWaifuImage(nsfwImage, { sourceName: nsfwSourceName });
        console.log(`✅ Posted NSFW image from ${nsfwSourceName}: ${nsfwImage.url}`);
      } else {
        console.warn('⚠️  No NSFW image found from any source');
      }
    }

    if (!config.postSfw && !config.postNsfw) {
      console.log('ℹ️  Both POST_SFW and POST_NSFW are disabled. Nothing to post.');
    }

    console.log(`[${new Date().toISOString()}] Scheduled post complete.\n`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Scheduled post failed:`, error instanceof Error ? error.message : error);
  }
}

/**
 * Validate cron expression
 */
function validateCronExpression(expression: string): boolean {
  return cron.validate(expression);
}

/**
 * Main scheduler function
 */
function main(): void {
  const cronSchedule = config.cronSchedule;

  // Validate cron expression
  if (!validateCronExpression(cronSchedule)) {
    console.error(`❌ Invalid cron expression: ${cronSchedule}`);
    console.error('Please check CRON_SCHEDULE in your .env file');
    process.exit(1);
  }

  console.log(`⏰ Scheduler started with schedule: ${cronSchedule}`);
  console.log(`📷 Image source: ${config.imageSource}`);
  console.log(`📝 Post SFW: ${config.postSfw}`);
  console.log(`🔞 Post NSFW: ${config.postNsfw}`);
  console.log('Waiting for scheduled posts...\n');

  // Schedule the job
  cron.schedule(cronSchedule, scheduledPost);

  // Run immediately on startup if enabled
  if (process.env.RUN_ON_STARTUP === 'true') {
    console.log('🚀 RUN_ON_STARTUP is true, running initial post...');
    scheduledPost();
  }
}

// Run main function
main();
