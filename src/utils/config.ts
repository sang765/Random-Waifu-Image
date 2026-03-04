/**
 * Configuration utility for loading and validating environment variables
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { SourceType } from '../types/source';
import { PICRE_TAGS } from '../types/picre';
import { DANBOORU_SFW_TAGS, DANBOORU_NSFW_TAGS } from '../types/danbooru';
import { RULE34_SFW_TAGS, RULE34_NSFW_TAGS } from '../types/rule34';
import { DanbooruCredentials } from '../clients/danbooru-client';
import { Rule34Credentials } from '../clients/rule34-client';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  // Discord Webhooks
  sfwWebhookUrl: string;
  nsfwWebhookUrl: string;

  // Image Source Configuration
  imageSource: SourceType;

  // Posting Configuration
  defaultTags: string[];
  cronSchedule: string;
  postSfw: boolean;
  postNsfw: boolean;
  fetchLimit: number;
}

// Available tags for random selection
export const SFW_TAGS = [
  'waifu',
  'maid',
  'uniform',
  'marin-kitagawa',
  'mori-calliope',
  'raiden-shogun',
  'oppai',
  'selfies',
  'ass',
  'hentai',
  'milf',
  'oral',
  'paizuri',
  'ecchi',
  'ero',
];

export const NSFW_TAGS = [
  'hentai',
  'oppai',
  'ecchi',
  'ero',
  'ass',
  'milf',
  'oral',
  'paizuri',
  'waifu',
  'maid',
  'uniform',
];

// NekosAPI-specific tags (these are the actual tag names from NekosAPI)
// See: https://nekosapi.com/docs
export const NEKOS_SFW_TAGS = [
  'girl',
  'boy',
  'animal_ears',
  'blonde_hair',
  'blue_eyes',
  'blue_hair',
  'brown_eyes',
  'brown_hair',
  'green_eyes',
  'green_hair',
  'long_hair',
  'pink_hair',
  'purple_eyes',
  'purple_hair',
  'red_eyes',
  'red_hair',
  'short_hair',
  'white_hair',
  'yellow_eyes',
];

export const NEKOS_NSFW_TAGS = [
  // NekosAPI uses rating=explicit for NSFW filtering, not tags
  // These are actual content tags that may appear in NSFW images
  'exposed_girl_breasts',
  'large_breasts',
  'medium_breasts',
  'girl',
  'pink_hair',
  'white_hair',
  'red_hair',
  'brown_hair',
  'blonde_hair',
  'blue_hair',
  'long_hair',
  'short_hair',
];

// waifu.pics-specific tags (categories)
// https://waifu.pics/docs
export const WAIFU_PICS_SFW_TAGS = [
  'waifu',
  'neko',
  'shinobu',
  'megumin',
  'bully',
  'cuddle',
  'cry',
  'hug',
  'awoo',
  'kiss',
  'lick',
  'pat',
  'smug',
  'bonk',
  'yeet',
  'blush',
  'smile',
  'wave',
  'highfive',
  'handhold',
  'nom',
  'bite',
  'glomp',
  'slap',
  'kill',
  'kick',
  'happy',
  'wink',
  'poke',
  'dance',
  'cringe',
];

export const WAIFU_PICS_NSFW_TAGS = [
  'waifu',
  'neko',
  'trap',
  'blowjob',
];

// Pic.re-specific tags (SFW only - Pic.re doesn't provide NSFW content)
// https://doc.pic.re/usage-shi-yong/api
export const PICRE_SFW_TAGS = PICRE_TAGS;

export const PICRE_NSFW_TAGS: string[] = []; // Pic.re is SFW-only by design

// nekos.best-specific tags (categories)
// https://docs.nekos.best/
// nekos.best provides both static images (PNG) and GIFs
// Image categories: neko, waifu, husbando, kitsune
// GIF categories: lurk, shoot, sleep, clap, shrug, stare, wave, poke, confused, smile, etc.
export const NEKOS_BEST_SFW_TAGS = [
  // Image categories
  'neko',
  'waifu',
  'husbando',
  'kitsune',
  // GIF categories - reactions/emotes
  'hug',
  'kiss',
  'cuddle',
  'pat',
  'poke',
  'tickle',
  'slap',
  'bonk',
  'wave',
  'wink',
  'smile',
  'blush',
  'cry',
  'happy',
  'sleep',
  'dance',
  'kick',
  'punch',
  'shoot',
  'stare',
  'think',
  'confused',
  'angry',
  'baka',
  'bite',
  'blowkiss',
  'clap',
  'facepalm',
  'feed',
  'handhold',
  'handshake',
  'highfive',
  'laugh',
  'lurk',
  'nod',
  'nom',
  'nope',
  'peck',
  'pout',
  'run',
  'salute',
  'shrug',
  'sip',
  'smug',
  'spin',
  'tableflip',
  'teehee',
  'thumbsup',
  'wag',
  'yawn',
  'yeet',
  'shocked',
  'bleh',
  'bored',
  'nya',
  'lappillow',
  'carry',
  'kabedon',
  'shake',
];

export const NEKOS_BEST_NSFW_TAGS: string[] = []; // nekos.best is SFW-only by design

/**
 * Get tags appropriate for the selected source
 */
export function getTagsForSource(source: SourceType, type: 'sfw' | 'nsfw'): string[] {
  switch (source) {
    case 'nekosapi':
      return type === 'sfw' ? NEKOS_SFW_TAGS : NEKOS_NSFW_TAGS;
    case 'waifu.pics':
      return type === 'sfw' ? WAIFU_PICS_SFW_TAGS : WAIFU_PICS_NSFW_TAGS;
    case 'pic.re':
      // Pic.re is SFW-only, return empty array for NSFW
      return type === 'sfw' ? PICRE_SFW_TAGS : PICRE_NSFW_TAGS;
    case 'nekos.best':
      // nekos.best is SFW-only, return empty array for NSFW
      return type === 'sfw' ? NEKOS_BEST_SFW_TAGS : NEKOS_BEST_NSFW_TAGS;
    case 'danbooru':
      return type === 'sfw' ? DANBOORU_SFW_TAGS : DANBOORU_NSFW_TAGS;
    case 'rule34':
      return type === 'sfw' ? RULE34_SFW_TAGS : RULE34_NSFW_TAGS;
    case 'waifu.im':
    case 'both':
    case 'random':
    default:
      return type === 'sfw' ? SFW_TAGS : NSFW_TAGS;
  }
}

/**
 * Get random tags from the available pool
 * @param type - SFW or NSFW tags
 * @param count - Number of tags to return
 * @param source - Which image source to get tags for (defaults to waifu.im)
 */
export function getRandomTags(
  type: 'sfw' | 'nsfw',
  count: number = 1,
  source: SourceType = 'waifu.im'
): string[] {
  const tags = getTagsForSource(source, type);
  const shuffled = [...tags].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getBooleanEnvVar(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function getNumberEnvVar(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return defaultValue;
  return parsed;
}

function getSourceTypeEnvVar(key: string, defaultValue: SourceType): SourceType {
  const value = process.env[key];
  if (!value) return defaultValue;
  const validSources: SourceType[] = ['waifu.im', 'nekosapi', 'waifu.pics', 'pic.re', 'nekos.best', 'danbooru', 'rule34', 'both', 'random'];
  return validSources.includes(value as SourceType) ? (value as SourceType) : defaultValue;
}

/**
 * Load Danbooru API credentials from environment variables
 * Returns undefined if credentials are not configured
 */
export function loadDanbooruCredentials(): DanbooruCredentials | undefined {
  const username = process.env['DANBOORU_USERNAME'] || process.env['DANBOORU_LOGIN'];
  const apiKey = process.env['DANBOORU_API_KEY'];

  if (username && apiKey) {
    return { username, apiKey };
  }

  return undefined;
}

/**
 * Load Rule 34 API credentials from environment variables
 * Returns undefined if credentials are not configured
 */
export function loadRule34Credentials(): Rule34Credentials | undefined {
  const userId = process.env['RULE34_USER_ID'];
  const apiKey = process.env['RULE34_API_KEY'];

  if (userId && apiKey) {
    return { userId, apiKey };
  }

  return undefined;
}

/**
 * Load Rule 34 AI filter setting from environment variables
 * Default: true (disable AI-generated images)
 * @returns boolean - true if AI posts should be disabled
 */
export function loadR34DisableAiPost(): boolean {
  const value = process.env['R34_DISABLE_AI_POST'];
  if (value === undefined) return true; // Default to true (disable AI)
  return value.toLowerCase() === 'true' || value === '1';
}

export function loadConfig(): AppConfig {
  return {
    sfwWebhookUrl: getEnvVar('SFW_WEBHOOK_URL', ''),
    nsfwWebhookUrl: getEnvVar('NSFW_WEBHOOK_URL', ''),
    imageSource: getSourceTypeEnvVar('IMAGE_SOURCE', 'waifu.im'),
    defaultTags: getEnvVar('DEFAULT_TAGS', '')
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0),
    cronSchedule: getEnvVar('CRON_SCHEDULE', '0 */6 * * *'),
    postSfw: getBooleanEnvVar('POST_SFW', true),
    postNsfw: getBooleanEnvVar('POST_NSFW', false),
    fetchLimit: Math.min(30, Math.max(1, getNumberEnvVar('FETCH_LIMIT', 1))),
  };
}

// Export singleton instance
export const config = loadConfig();
