/**
 * Type definitions for yande.re API responses
 * API Documentation: https://yande.re/help/api
 * Based on Moebooru/Danbooru API
 */

/**
 * yande.re content rating levels
 * s = safe
 * q = questionable (NSFW)
 * e = explicit (NSFW)
 */
export type YandeRating = 's' | 'q' | 'e';

/**
 * yande.re post record returned by the API
 */
export interface YandePost {
  /** Unique post ID */
  id: number;
  /** Space-separated list of all tags */
  tags: string;
  /** Creation timestamp (Unix timestamp) */
  created_at: number;
  /** Last update timestamp (Unix timestamp) */
  updated_at: number;
  /** ID of the user who uploaded the post */
  creator_id: number;
  /** ID of the user who approved the post */
  approver_id: number | null;
  /** Username of the post author */
  author: string;
  /** Change ID */
  change: number;
  /** Source URL where the image was originally found */
  source: string;
  /** Total score (upvotes - downvotes) */
  score: number;
  /** MD5 hash of the file */
  md5: string;
  /** File size in bytes */
  file_size: number;
  /** File extension (jpg, png, gif, etc.) */
  file_ext: string;
  /** Direct URL to the original file */
  file_url: string;
  /** Whether shown in index */
  is_shown_in_index: boolean;
  /** Direct URL to the preview (thumbnail) */
  preview_url: string;
  /** Preview width in pixels */
  preview_width: number;
  /** Preview height in pixels */
  preview_height: number;
  /** Actual preview width */
  actual_preview_width: number;
  /** Actual preview height */
  actual_preview_height: number;
  /** Direct URL to the sample (medium quality) */
  sample_url: string;
  /** Sample width in pixels */
  sample_width: number;
  /** Sample height in pixels */
  sample_height: number;
  /** Sample file size in bytes */
  sample_file_size: number;
  /** Direct URL to JPEG version */
  jpeg_url: string;
  /** JPEG width in pixels */
  jpeg_width: number;
  /** JPEG height in pixels */
  jpeg_height: number;
  /** JPEG file size in bytes */
  jpeg_file_size: number;
  /** Content rating: s, q, or e */
  rating: YandeRating;
  /** Whether the rating is locked */
  is_rating_locked: boolean;
  /** Whether the post has children */
  has_children: boolean;
  /** Parent post ID if this is a child post */
  parent_id: number | null;
  /** Post status */
  status: string;
  /** Whether the post is pending approval */
  is_pending: boolean;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Whether the post is held */
  is_held: boolean;
  /** Frames pending string */
  frames_pending_string: string;
  /** Frames pending */
  frames_pending: unknown[];
  /** Frames string */
  frames_string: string;
  /** Frames */
  frames: unknown[];
  /** Whether notes are locked */
  is_note_locked: boolean;
  /** Last note timestamp */
  last_noted_at: number;
  /** Last comment timestamp */
  last_commented_at: number;
}

/**
 * Options for fetching posts from yande.re
 */
export interface YandeFetchOptions {
  /** Tags to search for (space-separated in a single string, or array of tags) */
  tags?: string | string[];
  /** Whether to return random results */
  random?: boolean;
  /** MD5 hash to search for (takes priority over other params) */
  md5?: string;
  /** Number of results to return (max 100) */
  limit?: number;
  /** Page number for pagination */
  page?: number | string;
  /** Rating filter: s, q, e, or combinations */
  rating?: YandeRating | YandeRating[];
}

/**
 * Helper function to check if a rating is NSFW
 * s (safe) is considered SFW
 * q (questionable) and e (explicit) are considered NSFW
 */
export function isNsfwRating(rating: YandeRating): boolean {
  return rating === 'q' || rating === 'e';
}

/**
 * Helper function to parse tag strings into arrays
 */
export function parseTagString(tagString: string): string[] {
  if (!tagString || tagString.trim() === '') return [];
  return tagString.split(' ').filter(tag => tag.length > 0);
}

/**
 * Helper function to parse tags into categories
 */
export interface ParsedTags {
  artists: string[];
  characters: string[];
  copyright: string[];
  general: string[];
  meta: string[];
}

/**
 * Parse tags string into categorized tags
 * Note: yande.re doesn't provide separate tag string fields like Danbooru
 * This is a best-effort parsing based on common conventions
 */
export function parseYandeTags(tagsString: string): ParsedTags {
  const tags = parseTagString(tagsString);
  
  // Common character tag suffixes/prefixes
  const characterIndicators = ['_', '(', ')'];
  
  // Common copyright indicators
  const copyrightIndicators = ['(cosplay)', '(character)'];
  
  return {
    artists: [], // yande.re doesn't expose artist tags in post response
    characters: tags.filter(t => characterIndicators.some(ind => t.includes(ind))),
    copyright: tags.filter(t => copyrightIndicators.some(ind => t.toLowerCase().includes(ind))),
    general: tags,
    meta: [],
  };
}

/**
 * Common SFW tags for yande.re
 */
export const YANDE_SFW_TAGS = [
  '1girl',
  'solo',
  'long_hair',
  'breasts',
  'looking_at_viewer',
  'smile',
  'open_mouth',
  'short_hair',
  'blush',
  'multiple_girls',
  'highres',
  'thighhighs',
  'hat',
  'large_breasts',
  'simple_background',
  'holding',
  'ribbon',
  'blue_eyes',
  'dress',
  'very_long_hair',
];

/**
 * Common NSFW tags for yande.re (use with rating:q or rating:e)
 */
export const YANDE_NSFW_TAGS = [
  'nude',
  'nipples',
  'pussy',
  'ass',
  'panties',
  'bra',
  'lingerie',
  'swimsuit',
  'bikini',
  'towel',
  'bare_shoulders',
  'cleavage',
  'underwear',
  'barefoot',
  'bed',
  'on_bed',
];
