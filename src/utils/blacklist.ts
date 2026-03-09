/**
 * Blacklist utility for filtering images based on unwanted tags
 * Loads blacklist configuration from blacklist.json
 */

import * as fs from 'fs';
import * as path from 'path';
import { SourceType } from '../types/source';

/**
 * Structure of the blacklist.json file
 */
interface BlacklistConfig {
  tag: {
    blacklist: Record<string, string[]>;
  };
}

/**
 * Cache for the loaded blacklist configuration
 */
let blacklistCache: BlacklistConfig | null = null;

/**
 * Map of source names to their blacklist keys in the config
 */
const SOURCE_KEY_MAP: Record<SourceType, string | null> = {
  'waifu.im': 'waifuim',
  'nekosapi': 'nekosapi',
  'waifu.pics': null, // waifu.pics uses categories, not tags
  'pic.re': 'picre',
  'nekos.best': null, // nekos.best uses categories, not tags
  'danbooru': 'danbooru',
  'both': null, // 'both' is a meta-source, handled individually
  'random': null, // 'random' is a meta-source, handled individually
};

/**
 * Load the blacklist configuration from blacklist.json
 * @returns The parsed blacklist configuration
 */
export function loadBlacklist(): BlacklistConfig {
  if (blacklistCache) {
    return blacklistCache;
  }

  try {
    const blacklistPath = path.resolve(process.cwd(), 'src/config/blacklist.json');
    const fileContent = fs.readFileSync(blacklistPath, 'utf-8');
    const config: BlacklistConfig = JSON.parse(fileContent);
    blacklistCache = config;
    return config;
  } catch (error) {
    // If file doesn't exist or is invalid, return empty blacklist
    console.warn('Failed to load blacklist.json, using empty blacklist:', error instanceof Error ? error.message : String(error));
    return { tag: { blacklist: {} } };
  }
}

/**
 * Clear the blacklist cache (useful for testing or hot-reloading)
 */
export function clearBlacklistCache(): void {
  blacklistCache = null;
}

/**
 * Get blacklisted tags for a specific source
 * @param source - The source type to get blacklisted tags for
 * @returns Array of blacklisted tag names
 */
export function getBlacklistedTags(source: SourceType): string[] {
  const config = loadBlacklist();
  const key = SOURCE_KEY_MAP[source];

  if (!key) {
    return [];
  }

  return config.tag.blacklist[key] || [];
}

/**
 * Get blacklisted tags for a source by its blacklist key name
 * @param sourceKey - The key name in the blacklist config (e.g., 'danbooru', 'nekosapi')
 * @returns Array of blacklisted tag names
 */
export function getBlacklistedTagsByKey(sourceKey: string): string[] {
  const config = loadBlacklist();
  return config.tag.blacklist[sourceKey] || [];
}

/**
 * Check if an image should be filtered based on its tags
 * @param imageTags - Array of tag names from the image
 * @param blacklistedTags - Array of blacklisted tag names
 * @returns true if the image should be filtered (contains blacklisted tags)
 */
export function shouldFilterImage(imageTags: string[], blacklistedTags: string[]): boolean {
  if (!blacklistedTags.length || !imageTags.length) {
    return false;
  }

  const normalizedImageTags = imageTags.map(tag => tag.toLowerCase().trim());
  const normalizedBlacklist = blacklistedTags.map(tag => tag.toLowerCase().trim());

  return normalizedImageTags.some(tag => normalizedBlacklist.includes(tag));
}

/**
 * Filter images that contain blacklisted tags
 * @param images - Array of images with tags property
 * @param blacklistedTags - Array of blacklisted tag names
 * @returns Filtered array of images without blacklisted tags
 */
export function filterImagesByTags<T extends { tags?: Array<{ name: string }> | string[] }>(
  images: T[],
  blacklistedTags: string[]
): T[] {
  if (!blacklistedTags.length) {
    return images;
  }

  return images.filter(image => {
    if (!image.tags || image.tags.length === 0) {
      return true;
    }

    // Handle both array of strings and array of objects with name property
    const tagNames = image.tags.map(tag => {
      if (typeof tag === 'string') {
        return tag;
      }
      return tag.name;
    });

    return !shouldFilterImage(tagNames, blacklistedTags);
  });
}

/**
 * Get all available source keys that support blacklisting
 * @returns Array of source key names
 */
export function getSupportedSources(): string[] {
  const config = loadBlacklist();
  return Object.keys(config.tag.blacklist);
}

/**
 * Check if a source supports tag-based blacklisting
 * @param source - The source type to check
 * @returns true if the source supports tag-based blacklisting
 */
export function supportsTagBlacklisting(source: SourceType): boolean {
  return SOURCE_KEY_MAP[source] !== null;
}
