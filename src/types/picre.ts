/**
 * Type definitions for Pic.re API
 * API Documentation: https://doc.pic.re/usage-shi-yong/api
 *
 * Pic.re is a free public anime picture API providing SFW images only.
 * All images are filtered using AI content detection + manual tagging.
 */

/**
 * Response from GET /images.json endpoint
 * Returns metadata for a random anime image
 */
export interface PicreImage {
  /** Direct URL to the image file */
  file_url: string;
  /** MD5 hash of the image */
  md5: string;
  /** Array of tags associated with the image */
  tags: string[];
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Original source URL (e.g., Pixiv link) */
  source: string | null;
  /** Artist/uploader name */
  author: string | null;
  /** Unique image ID in the database */
  _id: number;
  /** Whether the image has child images (variants) */
  has_children?: boolean;
}

/**
 * Options for fetching images from Pic.re API
 */
export interface PicreFetchOptions {
  /** Tags to include (comma-separated, e.g., 'girl,short_hair') */
  includedTags?: string[];
  /** Tags to exclude (comma-separated, e.g., 'boy,long_hair') */
  excludedTags?: string[];
  /** Specific image ID to fetch */
  id?: number;
  /** Whether to use webp compression (default: true) */
  compress?: boolean;
  /** Minimum image dimension (default: no limit) */
  minSize?: number;
  /** Maximum image dimension (default: 6144) */
  maxSize?: number;
}

/**
 * Response from GET /tags endpoint
 * Returns list of available tags with image counts
 */
export interface PicreTag {
  /** Tag name */
  name: string;
  /** Number of images with this tag */
  count: number;
}

/**
 * Available SFW categories/tags commonly used on Pic.re
 * Based on the most popular tags from the API
 */
export const PICRE_TAGS = [
  'long_hair',
  'short_hair',
  'blonde_hair',
  'blue_hair',
  'brown_hair',
  'green_hair',
  'pink_hair',
  'purple_hair',
  'red_hair',
  'white_hair',
  'black_hair',
  'blue_eyes',
  'brown_eyes',
  'green_eyes',
  'purple_eyes',
  'red_eyes',
  'yellow_eyes',
  'girl',
  'boy',
  'original',
  'blush',
  'smile',
  'open_mouth',
  'ahoge',
  'animal_ears',
  'bangs',
  'bare_shoulders',
  'belt',
  'bow',
  'breasts',
  'choker',
  'cleavage',
  'closed_eyes',
  'collarbone',
  'dress',
  'earrings',
  'eyepatch',
  'flower',
  'glasses',
  'gloves',
  'hair_bow',
  'hair_flower',
  'hair_ornament',
  'hair_ribbon',
  'hairclip',
  'hat',
  'holding',
  'hood',
  'hoodie',
  'jacket',
  'jewelry',
  'looking_at_viewer',
  'one_eye_closed',
  'pointy_ears',
  'ribbon',
  'scarf',
  'school_uniform',
  'serafuku',
  'shirt',
  'short_sleeves',
  'skirt',
  'solo',
  'thighhighs',
  'twintails',
  'weapon',
  'wings',
];
