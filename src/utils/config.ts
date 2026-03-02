/**
 * Configuration utility for loading and validating environment variables
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  // Discord Webhooks
  sfwWebhookUrl: string;
  nsfwWebhookUrl: string;

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

/**
 * Get random tags from the available pool
 */
export function getRandomTags(type: 'sfw' | 'nsfw', count: number = 1): string[] {
  const tags = type === 'sfw' ? SFW_TAGS : NSFW_TAGS;
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

export function loadConfig(): AppConfig {
  return {
    sfwWebhookUrl: getEnvVar('SFW_WEBHOOK_URL', ''),
    nsfwWebhookUrl: getEnvVar('NSFW_WEBHOOK_URL', ''),
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
