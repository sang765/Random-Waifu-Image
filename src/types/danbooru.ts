/**
 * Type definitions for Danbooru API responses
 * API Documentation: https://danbooru.donmai.us/wiki_pages/help:api
 */

/**
 * Danbooru content rating levels
 * g = general (safe)
 * s = sensitive (borderline)
 * q = questionable (mild NSFW)
 * e = explicit (NSFW)
 */
export type DanbooruRating = 'g' | 's' | 'q' | 'e';

/**
 * Danbooru post record returned by the API
 */
export interface DanbooruPost {
  /** Unique post ID */
  id: number;
  /** Content rating: g, s, q, or e */
  rating: DanbooruRating;
  /** Parent post ID if this is a child post */
  parent_id: number | null;
  /** Source URL where the image was originally found */
  source: string;
  /** MD5 hash of the file (only visible if authorized) */
  md5?: string;
  /** ID of the user who uploaded the post */
  uploader_id: number;
  /** ID of the user who approved the post */
  approver_id: number | null;
  /** File extension (jpg, png, gif, etc.) */
  file_ext: string;
  /** File size in bytes */
  file_size: number;
  /** Image width in pixels */
  image_width: number;
  /** Image height in pixels */
  image_height: number;
  /** Total score (upvotes - downvotes) */
  score: number;
  /** Upvote count */
  up_score: number;
  /** Downvote count */
  down_score: number;
  /** Number of users who favorited this post */
  fav_count: number;
  /** Whether the post is pending approval */
  is_pending: boolean;
  /** Whether the post is flagged for deletion */
  is_flagged: boolean;
  /** Whether the post is deleted */
  is_deleted: boolean;
  /** Space-separated list of all tags */
  tag_string: string;
  /** Total number of tags */
  tag_count: number;
  /** Number of general tags */
  tag_count_general: number;
  /** Number of artist tags */
  tag_count_artist: number;
  /** Number of copyright tags */
  tag_count_copyright: number;
  /** Number of character tags */
  tag_count_character: number;
  /** Number of meta tags */
  tag_count_meta: number;
  /** Timestamp of last comment */
  last_commented_at: string | null;
  /** Timestamp of last comment bump */
  last_comment_bumped_at: string | null;
  /** Timestamp of last note edit */
  last_noted_at: string | null;
  /** Whether this post has child posts */
  has_children: boolean;
  /** Whether this post has active children */
  has_active_children: boolean;
  /** Pixiv ID if sourced from Pixiv */
  pixiv_id: number | null;
  /** Bit flags for post state */
  bit_flags: number;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;

  // Derived fields (from media asset)
  /** Whether a large/sample version exists */
  has_large?: boolean;
  /** Whether visible children exist */
  has_visible_children?: boolean;
  /** Direct URL to the original file (only if visible to user) */
  file_url?: string;
  /** Direct URL to the large/sample file (only if visible to user) */
  large_file_url?: string;
  /** Direct URL to the 180x180 preview */
  preview_file_url?: string;

  // Tag string breakdowns
  /** Space-separated general tags */
  tag_string_general: string;
  /** Space-separated artist tags */
  tag_string_artist: string;
  /** Space-separated copyright tags */
  tag_string_copyright: string;
  /** Space-separated character tags */
  tag_string_character: string;
  /** Space-separated meta tags */
  tag_string_meta: string;
}

/**
 * Options for fetching posts from Danbooru
 */
export interface DanbooruFetchOptions {
  /** Tags to search for (space-separated in a single string, or array of tags) */
  tags?: string | string[];
  /** Whether to return random results */
  random?: boolean;
  /** MD5 hash to search for (takes priority over other params) */
  md5?: string;
  /** Number of results to return (max 200) */
  limit?: number;
  /** Page number for pagination */
  page?: number | string;
  /** Rating filter: g, s, q, e, or combinations */
  rating?: DanbooruRating | DanbooruRating[];
}

/**
 * Danbooru API error response
 */
export interface DanbooruApiError {
  success: false;
  reason: string;
  message?: string;
}

/**
 * Helper function to check if a rating is NSFW
 * g (general) and s (sensitive) are considered SFW
 * q (questionable) and e (explicit) are considered NSFW
 */
export function isNsfwRating(rating: DanbooruRating): boolean {
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
 * Common SFW tags for Danbooru
 */
export const DANBOORU_SFW_TAGS = [
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
  'absurdres',
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
 * Common NSFW tags for Danbooru (use with rating:q or rating:e)
 */
export const DANBOORU_NSFW_TAGS = [
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

/**
 * Tags that can be combined with character names
 */
export const DANBOORU_CHARACTER_MODIFIERS = [
  'solo',
  '1girl',
  '1boy',
  'multiple_girls',
  'multiple_boys',
];
