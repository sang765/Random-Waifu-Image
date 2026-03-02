/**
 * Main entry point for random-waifu-discord
 *
 * Usage:
 *   npm start -- --help              # Show help
 *   npm start                        # Post SFW image with random tags
 *   npm start -- --nsfw              # Post NSFW image with random tags
 *   npm start -- --tags waifu,maid   # Post with specific tags
 *   npm start -- --sfw --nsfw        # Post both SFW and NSFW
 *   npm start -- --random-tags 3     # Use 3 random tags
 */

import { Command } from 'commander';
import { config, getRandomTags } from './utils/config';
import { waifuClient } from './clients/waifu-client';
import { DiscordWebhookClient } from './clients/discord-webhook';
import { WaifuImage } from './types/waifu';

interface CliOptions {
  sfw?: boolean;
  nsfw?: boolean;
  tags?: string;
  randomTags?: boolean | string;
  dryRun?: boolean;
}

const program = new Command();

program
  .name('random-waifu-discord')
  .description('Send random waifu images from waifu.im to Discord')
  .version('1.0.0')
  .option('--sfw', 'post SFW image (overrides env config)', false)
  .option('--nsfw', 'post NSFW image (overrides env config)', false)
  .option('-t, --tags <tags>', 'comma-separated tags to filter by', '')
  .option('-r, --random-tags [count]', 'use random tags (default: 1 if no number specified)')
  .option('--dry-run', 'fetch image but don\'t post to Discord', false)
  .parse();

const options: CliOptions = program.opts();

/**
 * Parse tags from CLI argument, env, or generate random
 */
function parseTags(type: 'sfw' | 'nsfw'): string[] {
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
  return getRandomTags(type, randomCount);
}

/**
 * Post a waifu image to Discord
 */
async function postWaifu(
  image: WaifuImage,
  webhookUrl: string,
  isNsfw: boolean
): Promise<void> {
  if (options.dryRun) {
    console.log(`[DRY RUN] Would post ${isNsfw ? 'NSFW' : 'SFW'} image: ${image.url}`);
    console.log(`  Tags: ${image.tags?.map(t => t.name).join(', ') || 'none'}`);
    console.log(`  Artist: ${image.artists?.[0]?.name || 'unknown'}`);
    return;
  }

  const client = new DiscordWebhookClient(webhookUrl);
  await client.sendWaifuImage(image);
  console.log(`✅ Posted ${isNsfw ? 'NSFW' : 'SFW'} image to Discord`);
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Determine what to post
    const shouldPostSfw = options.sfw || (!options.nsfw && config.postSfw);
    const shouldPostNsfw = options.nsfw || config.postNsfw;

    // Post SFW image
    if (shouldPostSfw) {
      if (!config.sfwWebhookUrl) {
        console.warn('⚠️  SFW_WEBHOOK_URL not set, skipping SFW post');
      } else {
        const sfwTags = parseTags('sfw');
        console.log(`🏷️  SFW Tags: ${sfwTags.join(', ')}`);
        console.log('📥 Fetching SFW image...');
        const sfwImage = await waifuClient.fetchRandomSfw(sfwTags);
        
        if (sfwImage) {
          console.log(`🖼️  Found SFW image: ${sfwImage.url}`);
          await postWaifu(sfwImage, config.sfwWebhookUrl, false);
        } else {
          console.warn('⚠️  No SFW image found matching criteria');
        }
      }
    }

    // Post NSFW image
    if (shouldPostNsfw) {
      if (!config.nsfwWebhookUrl) {
        console.warn('⚠️  NSFW_WEBHOOK_URL not set, skipping NSFW post');
      } else {
        const nsfwTags = parseTags('nsfw');
        console.log(`🏷️  NSFW Tags: ${nsfwTags.join(', ')}`);
        console.log('📥 Fetching NSFW image...');
        const nsfwImage = await waifuClient.fetchRandomNsfw(nsfwTags);
        
        if (nsfwImage) {
          console.log(`🖼️  Found NSFW image: ${nsfwImage.url}`);
          await postWaifu(nsfwImage, config.nsfwWebhookUrl, true);
        } else {
          console.warn('⚠️  No NSFW image found matching criteria');
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
