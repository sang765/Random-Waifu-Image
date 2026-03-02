/**
 * Unified interface for abstracting different waifu image sources
 * Allows the project to work with multiple APIs (waifu.im, nekosapi.com, etc.)
 */

/**
 * Normalized image format that works across all sources
 */
export interface SourceImage {
  /** Unique identifier for the image */
  id: string | number;
  /** Direct URL to the image */
  url: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Source/original URL where the image was found */
  source?: string | null;
  /** List of artists who created the image */
  artists?: Array<{
    name: string;
    url?: string | null;
  }>;
  /** List of tags associated with the image */
  tags?: Array<{
    name: string;
  }>;
  /** Whether the image is NSFW */
  isNsfw: boolean;
  /** Dominant color for embed theming */
  dominantColor?: string;
}

/**
 * Options for fetching images from a source
 */
export interface SourceFetchOptions {
  /** Tags to include in the search */
  includedTags?: string[];
  /** Tags to exclude from the search */
  excludedTags?: string[];
  /** Number of images to fetch */
  limit?: number;
  /** Whether to fetch NSFW content */
  isNsfw?: boolean;
}

/**
 * Interface that all image sources must implement
 */
export interface WaifuSource {
  /** Human-readable name of the source */
  readonly name: string;

  /**
   * Fetch a single random SFW image
   * @param tags - Optional tags to filter by
   * @returns A SourceImage or null if none found
   */
  fetchRandomSfw(tags?: string[]): Promise<SourceImage | null>;

  /**
   * Fetch a single random NSFW image
   * @param tags - Optional tags to filter by
   * @returns A SourceImage or null if none found
   */
  fetchRandomNsfw(tags?: string[]): Promise<SourceImage | null>;
}

/**
 * Extended interface for sources that support batch fetching
 */
export interface BatchWaifuSource extends WaifuSource {
  /**
   * Fetch multiple images with options
   * @param options - Fetch options
   * @returns Array of SourceImages
   */
  fetchImages(options: SourceFetchOptions): Promise<SourceImage[]>;
}

/**
 * Supported image source identifiers
 */
export type SourceType = 'waifu.im' | 'nekosapi' | 'waifu.pics' | 'pic.re' | 'both' | 'random';

/**
 * Normalize source type (treats 'random' as 'both')
 */
export function normalizeSourceType(source: SourceType): SourceType {
  return source === 'random' ? 'both' : source;
}

/**
 * Helper function to convert hex color to decimal for Discord embeds
 */
export function hexToDecimal(hex: string | undefined): number | undefined {
  if (!hex) return undefined;
  try {
    const cleanHex = hex.replace('#', '');
    return parseInt(cleanHex, 16);
  } catch {
    return undefined;
  }
}
