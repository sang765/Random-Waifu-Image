/**
 * Scheduler for running periodic waifu posts using node-cron
 *
 * This script runs continuously and posts images according to the CRON_SCHEDULE
 * defined in the .env file (default: every 6 hours)
 */

import cron from 'node-cron';
import { config, getRandomTags } from './utils/config';
import { waifuClient } from './clients/waifu-client';
import { DiscordWebhookClient } from './clients/discord-webhook';

/**
 * Post waifu images to Discord
 */
async function scheduledPost(): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Running scheduled post...`);

  try {
    // Post SFW image
    if (config.postSfw && config.sfwWebhookUrl) {
      const sfwTags = config.defaultTags.length > 0 ? config.defaultTags : getRandomTags('sfw', 1);
      console.log(`🏷️  SFW Tags: ${sfwTags.join(', ')}`);
      console.log('📥 Fetching SFW image...');
      const sfwImage = await waifuClient.fetchRandomSfw(sfwTags);
      
      if (sfwImage) {
        const client = new DiscordWebhookClient(config.sfwWebhookUrl);
        await client.sendWaifuImage(sfwImage);
        console.log(`✅ Posted SFW image: ${sfwImage.url}`);
      } else {
        console.warn('⚠️  No SFW image found');
      }
    }

    // Post NSFW image
    if (config.postNsfw && config.nsfwWebhookUrl) {
      const nsfwTags = config.defaultTags.length > 0 ? config.defaultTags : getRandomTags('nsfw', 1);
      console.log(`🏷️  NSFW Tags: ${nsfwTags.join(', ')}`);
      console.log('📥 Fetching NSFW image...');
      const nsfwImage = await waifuClient.fetchRandomNsfw(nsfwTags);
      
      if (nsfwImage) {
        const client = new DiscordWebhookClient(config.nsfwWebhookUrl);
        await client.sendWaifuImage(nsfwImage);
        console.log(`✅ Posted NSFW image: ${nsfwImage.url}`);
      } else {
        console.warn('⚠️  No NSFW image found');
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
async function main(): Promise<void> {
  console.log('🎌 Random Waifu Discord Scheduler');
  console.log('=================================');
  console.log(`Cron schedule: ${config.cronSchedule}`);
  console.log(`Post SFW: ${config.postSfw}`);
  console.log(`Post NSFW: ${config.postNsfw}`);
  console.log(`Default tags: ${config.defaultTags.join(', ') || 'none'}`);
  console.log('=================================\n');

  // Validate cron expression
  if (!validateCronExpression(config.cronSchedule)) {
    console.error(`❌ Invalid cron expression: ${config.cronSchedule}`);
    console.error('Please check your CRON_SCHEDULE environment variable.');
    process.exit(1);
  }

  // Schedule the job
  console.log(`⏰ Scheduling job with cron: ${config.cronSchedule}`);
  
  cron.schedule(config.cronSchedule, scheduledPost, {
    scheduled: true,
    timezone: 'UTC',
  });

  console.log('✅ Scheduler started. Press Ctrl+C to stop.\n');

  // Run initial post if both webhooks are configured
  if ((config.postSfw && config.sfwWebhookUrl) || (config.postNsfw && config.nsfwWebhookUrl)) {
    console.log('🚀 Running initial post...');
    await scheduledPost();
  } else {
    console.warn('⚠️  No webhooks configured. Please check your .env file.');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down scheduler...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down scheduler...');
  process.exit(0);
});

// Run main function
main();
