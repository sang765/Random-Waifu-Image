/**
 * Main entry point for random-waifu-discord
 *
 * Usage:
 *   npm start -- --help                    # Show help
 *   npm start                              # Post SFW image with random tags
 *   npm start -- --nsfw                    # Post NSFW image with random tags
 *   npm start -- --tags waifu,maid         # Post with specific tags
 *   npm start -- --sfw --nsfw              # Post both SFW and NSFW
 *   npm start -- --random-tags 3           # Use 3 random tags
 *   npm start -- --source nekosapi         # Use NekosAPI source
 *   npm start -- --source waifu.pics       # Use waifu.pics source
 *   npm start -- --source pic.re           # Use pic.re source
 *   npm start -- --source nekos.best       # Use nekos.best source
 *   npm start -- --source danbooru         # Use Danbooru source
 *   npm start -- --source both             # Randomly select from all sources
 */

import { Command } from 'commander';
import { config, getRandomTags, loadDanbooruCredentials } from './utils/config';
import { waifuClient } from './clients/waifu-client';
import { nekosClient } from './clients/nekos-client';
import { waifuPicsClient } from './clients/waifu-pics-client';
import { picreClient } from './clients/picre-client';
import { nekosBestClient } from './clients/nekos-best-client';
import { initializeDanbooruClient, danbooruClient, DanbooruClient } from './clients/danbooru-client';
import { DiscordWebhookClient } from './clients/discord-webhook';
import { SourceImage, SourceType, WaifuSource } from './types/source';

// Initialize Danbooru client with credentials if available
const danbooruCredentials = loadDanbooruCredentials();
if (danbooruCredentials) {
  initializeDanbooruClient(danbooruCredentials);
  console.log('🔑 Danbooru credentials loaded');
}

interface CliOptions {
  sfw?: boolean;
  nsfw?: boolean;
  tags?: string;
  randomTags?: boolean | string;
  dryRun?: boolean;
  source?: SourceType;
}

const program = new Command();

program
  .name('random-waifu-discord')
  .description('Send random waifu images from waifu.im, nekosapi.com, waifu.pics, pic.re, nekos.best, or danbooru to Discord')
  .version('1.0.0')
  .option('--sfw', 'post SFW image (overrides env config)', false)
  .option('--nsfw', 'post NSFW image (overrides env config)', false)
  .option('-t, --tags <tags>', 'comma-separated tags to filter by', '')
  .option('-r, --random-tags [count]', 'use random tags (default: 1 if no number specified)')
  .option('-s, --source <source>', 'image source: waifu.im, nekosapi, waifu.pics, pic.re, nekos.best, danbooru, both, or random', config.imageSource)
  .option('--dry-run', 'fetch image but don\'t post to Discord', false)
  .parse();

const options: CliOptions = program.opts();

  /**
 * Get the appropriate image source based on CLI option or config
 */
function getImageSource(): WaifuSource {
  const source = options.source || config.imageSource;

  if (source === 'both' || source === 'random') {
    // Randomly select one of the sources
    const sources: WaifuSource[] = [waifuClient, nekosClient, waifuPicsClient, picreClient, nekosBestClient];
    // Add Danbooru if initialized with credentials
    if (danbooruClient) {
      sources.push(danbooruClient);
    }
    const randomIndex = Math.floor(Math.random() * sources.length);
    return sources[randomIndex];
  }

  if (source === 'nekosapi') return nekosClient;
  if (source === 'waifu.pics') return waifuPicsClient;
  if (source === 'pic.re') return picreClient;
  if (source === 'nekos.best') return nekosBestClient;
  if (source === 'danbooru') {
    if (!danbooruClient) {
      throw new Error('Danbooru source selected but no credentials configured. Please set DANBOORU_USERNAME and DANBOORU_API_KEY in your .env file.');
    }
    return danbooruClient;
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
 * Parse tags from CLI argument, env, or generate random
 */
function parseTags(type: 'sfw' | 'nsfw', sourceType: SourceType): string[] {
  // If tags are specified via CLI, use them
  if (options.tags) {
    return options.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  // If default tags from env, use them
  if (config.defaultTags.length > 0) {
    return config.defaultTags;
  }

  // Otherwise use random tags
  let randomCount = 1;
  if (options.randomTags !== undefined) {
    if (typeof options.randomTags === 'string' && options.randomTags !== '') {
      randomCount = parseInt(options.randomTags, 10) || 1;
    } else {
      randomCount = 1; // Default when --random-tags is used without value
    }
  }
  return getRandomTags(type, randomCount, sourceType);
}

/**
 * Post a waifu image to Discord
 */
async function postWaifu(
  image: SourceImage,
  webhookUrl: string,
  isNsfw: boolean,
  sourceName: string
): Promise<void> {
  if (options.dryRun) {
    console.log(`[DRY RUN] Would post ${isNsfw ? 'NSFW' : 'SFW'} image: ${image.url}`);
    console.log(`  Tags: ${image.tags?.map(t => t.name).join(', ') || 'none'}`);
    console.log(`  Artist: ${image.artists?.[0]?.name || 'unknown'}`);
    return;
  }

  const client = new DiscordWebhookClient(webhookUrl);
  await client.sendWaifuImage(image, { sourceName });
  console.log(`✅ Posted ${isNsfw ? 'NSFW' : 'SFW'} image from ${sourceName} to Discord`);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Determine what to post
    const shouldPostSfw = options.sfw || (!options.nsfw && config.postSfw);
    const shouldPostNsfw = options.nsfw || config.postNsfw;
    const sourceType = options.source || config.imageSource;
    const source = getImageSource();

    console.log(`📡 Using image source: ${source.name}`);

    // Post SFW image
    if (shouldPostSfw) {
      if (!config.sfwWebhookUrl) {
        console.warn('⚠️  SFW_WEBHOOK_URL not set, skipping SFW post');
      } else {
        const sfwTags = parseTags('sfw', sourceType);
        console.log(`🏷️  SFW Tags: ${sfwTags.join(', ')}`);
        
        const { image: sfwImage, sourceName: sfwSourceName } = await fetchImageWithFallback('sfw', source, sfwTags);
        
        if (sfwImage) {
          console.log(`🖼️  Found SFW image from ${sfwSourceName}: ${sfwImage.url}`);
          await postWaifu(sfwImage, config.sfwWebhookUrl, false, sfwSourceName);
        } else {
          console.warn('⚠️  No SFW image found from any source');
        }
      }
    }

    // Post NSFW image
    if (shouldPostNsfw) {
      if (!config.nsfwWebhookUrl) {
        console.warn('⚠️  NSFW_WEBHOOK_URL not set, skipping NSFW post');
      } else {
        const nsfwTags = parseTags('nsfw', sourceType);
        console.log(`🏷️  NSFW Tags: ${nsfwTags.join(', ')}`);
        
        const { image: nsfwImage, sourceName: nsfwSourceName } = await fetchImageWithFallback('nsfw', source, nsfwTags);
        
        if (nsfwImage) {
          console.log(`🖼️  Found NSFW image from ${nsfwSourceName}: ${nsfwImage.url}`);
          await postWaifu(nsfwImage, config.nsfwWebhookUrl, true, nsfwSourceName);
        } else {
          console.warn('⚠️  No NSFW image found from any source');
        }
      }
    }

    if (!shouldPostSfw && !shouldPostNsfw) {
      console.log('ℹ️  Nothing to post. Use --sfw or --nsfw flags, or enable in .env');
      process.exit(0);
    }

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run main function
main();
