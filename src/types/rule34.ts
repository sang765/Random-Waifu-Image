/**
 * Type definitions for Rule 34 API responses
 * API Documentation: https://api.rule34.xxx/index.php
 */

/**
 * Rule 34 content rating levels
 * safe = safe for work
 * questionable = borderline/mild NSFW
 * explicit = NSFW
 */
export type Rule34Rating = 'safe' | 'questionable' | 'explicit';

/**
 * Rule 34 post record returned by the API
 */
export interface Rule34Post {
  /** Unique post ID */
  id: number;
  /** Content rating: safe, questionable, or explicit */
  rating: Rule34Rating;
  /** List of tags (space-separated string from API) */
  tags: string;
  /** Source URL where the image was originally found */
  source: string;
  /** MD5 hash of the file */
  hash: string;
  /** Direct URL to the original file */
  file_url: string;
  /** Direct URL to the sample (resized) image */
  sample_url: string;
  /** Direct URL to the thumbnail/preview */
  preview_url: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Sample image width in pixels */
  sample_width: number;
  /** Sample image height in pixels */
  sample_height: number;
  /** Preview image width in pixels */
  preview_width: number;
  /** Preview image height in pixels */
  preview_height: number;
  /** Parent post ID if this is a child post */
  parent_id?: number;
  /** Whether the post has child posts */
  has_children: boolean;
  /** Whether the post is pending approval */
  pending: boolean;
  /** Creator ID of the post */
  creator_id: number;
  /** Post status (active, deleted, etc.) */
  status: string;
  /** Change ID (Unix timestamp) */
  change: number;
}

/**
 * Rule 34 API response structure (JSON format)
 */
export interface Rule34ApiResponse {
  /** Response type - 'post' for post queries */
  '@attributes': {
    limit: number;
    offset: number;
    count: number;
  };
  /** Array of posts */
  post?: Rule34Post[];
}

/**
 * Options for fetching posts from Rule 34
 */
export interface Rule34FetchOptions {
  /** Tags to search for (space-separated in a single string, or array of tags) */
  tags?: string | string[];
  /** Number of results to return (max 1000) */
  limit?: number;
  /** Page number (PID) for pagination */
  page?: number;
  /** Post ID to fetch specific post */
  id?: number;
  /** Change ID (Unix timestamp) to get posts after this change */
  changeId?: number;
  /** Whether to include deleted posts */
  deleted?: boolean;
}

/**
 * Rule 34 API error response
 */
export interface Rule34ApiError {
  success: false;
  message: string;
}

/**
 * Helper function to check if a rating is NSFW
 * safe is considered SFW
 * questionable and explicit are considered NSFW
 */
export function isNsfwRating(rating: Rule34Rating): boolean {
  return rating === 'questionable' || rating === 'explicit';
}

/**
 * Helper function to parse tag strings into arrays
 */
export function parseTagString(tagString: string | undefined): string[] {
  if (!tagString) return [];
  return tagString
    .split(' ')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

/**
 * Rule 34-specific tags for random selection
 * These are common tags that work well with Rule 34 API
 */
export const RULE34_SFW_TAGS = [
  'safe',
  'solo',
  '1girl',
  '1boy',
  'blonde_hair',
  'brown_hair',
  'black_hair',
  'blue_eyes',
  'red_eyes',
  'long_hair',
  'short_hair',
  'smile',
  'looking_at_viewer',
  'simple_background',
];

export const RULE34_NSFW_TAGS = [
  'explicit',
  'questionable',
  'solo',
  '1girl',
  '1boy',
  'blonde_hair',
  'brown_hair',
  'black_hair',
  'blue_eyes',
  'red_eyes',
  'long_hair',
  'short_hair',
  'large_breasts',
  'small_breasts',
];
