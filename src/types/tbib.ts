/**
 * Type definitions for TBIB (The Big ImageBoard) API responses
 * API Documentation: https://tbib.org/index.php?page=help&topic=dapi
 */

/**
 * TBIB content rating levels
 * safe = safe for work
 * questionable = borderline/mild NSFW
 * explicit = NSFW
 */
export type TBIBRating = 'safe' | 'questionable' | 'explicit';

/**
 * TBIB post record returned by the API
 */
export interface TBIBPost {
  /** Unique post ID */
  id: number;
  /** Directory for image storage */
  directory: number;
  /** Image filename */
  image: string;
  /** MD5 hash of the file */
  hash: string;
  /** Image height in pixels */
  height: number;
  /** Image width in pixels */
  width: number;
  /** Content rating: safe, questionable, or explicit */
  rating: TBIBRating;
  /** List of tags (space-separated string from API) */
  tags: string;
  /** Score (upvotes - downvotes) */
  score: number;
  /** Uploader/creator name */
  owner: string;
  /** Whether a sample version exists (1 = yes, 0 = no) */
  sample: number;
  /** Sample image height in pixels */
  sample_height: number;
  /** Sample image width in pixels */
  sample_width: number;
  /** Unix timestamp of last change */
  change: number;
  /** Parent post ID if this is a child post (0 if none) */
  parent_id: number;
}

/**
 * TBIB API response structure (JSON format)
 * Returns an array of posts directly
 */
export type TBIBApiResponse = TBIBPost[];

/**
 * Options for fetching posts from TBIB
 */
export interface TBIBFetchOptions {
  /** Tags to search for (space-separated in a single string, or array of tags) */
  tags?: string | string[];
  /** Number of results to return (max 100) */
  limit?: number;
  /** Page number (PID) for pagination */
  page?: number;
  /** Post ID to fetch specific post */
  id?: number;
  /** Change ID (Unix timestamp) to get posts after this change */
  changeId?: number;
}

/**
 * Check if a rating is NSFW (questionable or explicit)
 */
export function isNsfwRating(rating: TBIBRating): boolean {
  return rating === 'questionable' || rating === 'explicit';
}

/**
 * Parse space-separated tag string into array
 */
export function parseTagString(tags: string): string[] {
  return tags.split(/\s+/).filter(tag => tag.length > 0);
}

/**
 * Build the full image URL from a TBIB post
 */
export function getFullImageUrl(post: TBIBPost): string {
  return `https://tbib.org/images/${post.directory}/${post.image}`;
}

/**
 * Build the sample image URL from a TBIB post
 */
export function getSampleImageUrl(post: TBIBPost): string {
  return `https://tbib.org/samples/${post.directory}/sample_${post.hash}.jpg`;
}

/**
 * Build the TBIB post page URL
 */
export function getPostUrl(id: number): string {
  return `https://tbib.org/index.php?page=post&s=view&id=${id}`;
}

/**
 * Common SFW tags for TBIB
 * Tags that generally return safe content
 */
export const TBIB_SFW_TAGS = [
  '1girl',
  'solo',
  'safe',
  'rating:safe',
];

/**
 * Common NSFW tags for TBIB
 * Tags that may return NSFW content
 */
export const TBIB_NSFW_TAGS = [
  '1girl',
  'solo',
  'nude',
  'nipples',
  'pussy',
  'sex',
];
