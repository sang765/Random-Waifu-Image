/**
 * TBIB (The Big ImageBoard) API client for fetching anime images
 * API Documentation: https://tbib.org/index.php?page=help&topic=dapi
 * 
 * TBIB is a Danbooru-like image board with JSON API support.
 * No authentication required for basic API access.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  TBIBPost,
  TBIBFetchOptions,
  TBIBRating,
  isNsfwRating,
  parseTagString,
  getFullImageUrl,
  getPostUrl,
} from '../types/tbib';
import { SourceImage, WaifuSource } from '../types/source';
import { getBlacklistedTagsByKey, shouldFilterImage } from '../utils/blacklist';

/**
 * Options for the TBIB client
 * TBIB does not require authentication
 */
export interface TBIBClientOptions {
  /** Whether to disable AI-generated images (default: true) */
  disableAiPosts?: boolean;
}

export class TBIBClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://tbib.org';
  private readonly disableAiPosts: boolean;
  readonly name = 'tbib';

  /**
   * Track last request time for rate limiting
   */
  private lastRequestTime: number = 0;
  private readonly minRequestInterval = 500; // 500ms between requests to be respectful

  /**
   * AI-related tags to filter out when disableAiPosts is true
   */
  private readonly aiTags = [
    'ai_generated',
    'ai-assisted',
    'ai_assisted',
    'stable_diffusion',
    'novelai',
    'midjourney',
    'dall-e',
    'dall_e',
    'artificial_intelligence',
    'ai_art',
  ];

  constructor(options: TBIBClientOptions = {}) {
    this.disableAiPosts = options.disableAiPosts ?? true;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'RandomWaifuBot/1.0 (https://github.com/sang765/Random-Waifu-Image)',
      },
    });

    // Add response interceptor for rate limit handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 429) {
          // Rate limited - wait and retry once
          await this.delay(2000);
          if (error.config) {
            return this.client.request(error.config);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const delayMs = this.minRequestInterval - timeSinceLastRequest;
      await this.delay(delayMs);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Convert TBIB post to unified SourceImage format
   */
  private normalizeImage(post: TBIBPost): SourceImage {
    // Parse artists from tags (TBIB uses 'artist:' prefix for artist tags)
    const allTags = parseTagString(post.tags);
    const artists = allTags
      .filter(tag => tag.startsWith('artist:'))
      .map(tag => ({
        name: tag.replace('artist:', ''),
        url: null,
      }));

    // Parse character names (TBIB uses 'character:' prefix)
    const characters = allTags
      .filter(tag => tag.startsWith('character:'))
      .map(tag => tag.replace('character:', ''));

    // Parse copyright/series (TBIB uses copyright: prefix)
    const copyright = allTags
      .filter(tag => tag.startsWith('copyright:'))
      .map(tag => tag.replace('copyright:', ''));

    // Determine if NSFW based on rating
    const isNsfw = isNsfwRating(post.rating);

    // Map TBIB rating to our ContentRating
    const ratingMap: Record<TBIBRating, 'safe' | 'suggestive' | 'borderline' | 'explicit'> = {
      'safe': 'safe',
      'questionable': 'borderline',
      'explicit': 'explicit',
    };

    // Build TBIB post URL
    const postUrl = getPostUrl(post.id);

    // Get full image URL
    const fileUrl = getFullImageUrl(post);

    return {
      id: post.id,
      url: fileUrl,
      width: post.width,
      height: post.height,
      source: null, // TBIB doesn't provide source in the API response
      artists: artists.length > 0 ? artists : undefined,
      tags: allTags.map(name => ({ name })),
      isNsfw,
      rating: ratingMap[post.rating],
      characters: characters.length > 0 ? characters : undefined,
      contentHash: post.hash,
      createdAt: post.change ? new Date(post.change * 1000).toISOString() : undefined,
      copyright: copyright.length > 0 ? copyright : undefined,
      generalTags: allTags.filter(tag =>
        !tag.startsWith('artist:') &&
        !tag.startsWith('character:') &&
        !tag.startsWith('copyright:')
      ),
      postUrl,
      score: post.score,
    };
  }

  /**
   * Check if image has AI-related tags
   */
  private hasAiTags(image: SourceImage): boolean {
    if (!image.tags) return false;
    const tagNames = image.tags.map(tag => tag.name.toLowerCase());
    return this.aiTags.some(aiTag =>
      tagNames.some(tagName => tagName.includes(aiTag))
    );
  }

  /**
   * Get blacklisted tags for TBIB
   */
  private getBlacklistedTags(): string[] {
    return getBlacklistedTagsByKey('tbib');
  }

  /**
   * Build search tags string from options
   * Automatically includes blacklisted tags as negated tags (-tag_name)
   */
  private buildTags(options: TBIBFetchOptions): string {
    const tags: string[] = [];

    // Add user-provided tags
    if (options.tags) {
      if (Array.isArray(options.tags)) {
        tags.push(...options.tags);
      } else {
        tags.push(...options.tags.split(' '));
      }
    }

    // Add blacklisted tags as negated tags
    const blacklistedTags = this.getBlacklistedTags();
    for (const tag of blacklistedTags) {
      tags.push(`-${tag}`);
    }

    return tags.join(' ').trim();
  }

  /**
   * Fetch posts from TBIB API
   */
  async fetchPosts(options: TBIBFetchOptions = {}): Promise<TBIBPost[]> {
    await this.enforceRateLimit();

    const params = new URLSearchParams();
    
    // Required parameters
    params.append('page', 'dapi');
    params.append('s', 'post');
    params.append('q', 'index');
    params.append('json', '1');

    // Add specific post ID if provided
    if (options.id) {
      params.append('id', options.id.toString());
    } else {
      // Add tags
      const tags = this.buildTags(options);
      if (tags) {
        params.append('tags', tags);
      }

      // Add limit (max 100)
      const limit = Math.min(100, Math.max(1, options.limit ?? 1));
      params.append('limit', limit.toString());

      // Add pagination (PID = page ID)
      if (options.page !== undefined && options.page > 0) {
        params.append('pid', options.page.toString());
      }

      // Add change ID if provided
      if (options.changeId) {
        params.append('cid', options.changeId.toString());
      }
    }

    try {
      const response = await this.client.get<TBIBPost[]>(
        `/index.php?${params.toString()}`
      );

      // TBIB API returns an array directly when json=1
      const posts = Array.isArray(response.data) ? response.data : [];
      
      // Filter out posts without required fields
      return posts.filter(post => post.id && post.image);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('TBIB API error:', axiosError.message);
      if (axiosError.response) {
        console.error('Status:', axiosError.response.status);
        console.error('Data:', axiosError.response.data);
      }
      return [];
    }
  }

  /**
   * Fetch a single post by ID
   */
  async fetchPostById(id: number): Promise<TBIBPost | null> {
    const posts = await this.fetchPosts({ id });
    return posts.length > 0 ? posts[0] : null;
  }

  /**
   * Fetch random SFW images from TBIB
   * TBIB has SFW content (rating:safe)
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    // Fetch posts with safe rating
    const searchTags = tags ? [...tags, 'rating:safe'] : ['rating:safe'];
    const posts = await this.fetchPosts({
      tags: searchTags,
      limit: 50,
    });

    if (posts.length === 0) return null;

    // Filter AI-generated images if disabled
    let images = posts.map(post => this.normalizeImage(post));
    
    if (this.disableAiPosts) {
      const beforeCount = images.length;
      images = images.filter(img => !this.hasAiTags(img));
      const filteredCount = beforeCount - images.length;
      if (filteredCount > 0) {
        console.log(`[TBIB] Filtered out ${filteredCount} AI-generated image(s)`);
      }
    }

    // Verify rating - only allow safe images for SFW
    const beforeRatingFilter = images.length;
    images = images.filter(img => img.rating === 'safe');
    const ratingFilteredCount = beforeRatingFilter - images.length;
    if (ratingFilteredCount > 0) {
      console.log(`[TBIB] Filtered out ${ratingFilteredCount} image(s) with incorrect rating for SFW request`);
    }

    if (images.length === 0) {
      console.log('[TBIB] No safe images found after filtering. Retrying...');
      return null;
    }
    
    // Pick a random post from the results
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  /**
   * Fetch random NSFW images from TBIB
   * TBIB supports questionable and explicit ratings
   */
  async fetchRandomNsfw(tags?: string[]): Promise<SourceImage | null> {
    // Fetch posts - exclude safe rating for NSFW
    const searchTags = tags ? [...tags, '-rating:safe'] : ['-rating:safe'];
    const posts = await this.fetchPosts({
      tags: searchTags,
      limit: 50,
    });

    if (posts.length === 0) return null;

    // Filter AI-generated images if disabled
    let images = posts.map(post => this.normalizeImage(post));
    
    if (this.disableAiPosts) {
      const beforeCount = images.length;
      images = images.filter(img => !this.hasAiTags(img));
      const filteredCount = beforeCount - images.length;
      if (filteredCount > 0) {
        console.log(`[TBIB] Filtered out ${filteredCount} AI-generated image(s)`);
      }
    }

    // Verify rating - only allow questionable or explicit images for NSFW
    const beforeRatingFilter = images.length;
    images = images.filter(img => img.rating === 'borderline' || img.rating === 'explicit');
    const ratingFilteredCount = beforeRatingFilter - images.length;
    if (ratingFilteredCount > 0) {
      console.log(`[TBIB] Filtered out ${ratingFilteredCount} image(s) with incorrect rating for NSFW request`);
    }

    if (images.length === 0) {
      console.log('[TBIB] No NSFW images found after filtering. Retrying...');
      return null;
    }
    
    // Pick a random post from the results
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  /**
   * Fetch multiple images with options
   * Results are filtered to exclude images with blacklisted tags
   * Also filters AI-generated images if TBIB_DISABLE_AI_POST is true
   */
  async fetchImages(options: TBIBFetchOptions = {}): Promise<SourceImage[]> {
    const posts = await this.fetchPosts(options);
    let images = posts.map(post => this.normalizeImage(post));

    // Filter out images with blacklisted tags as a safety measure
    const blacklistedTags = this.getBlacklistedTags();
    if (blacklistedTags.length > 0) {
      images = images.filter(image => {
        const tagNames = image.tags?.map(tag => tag.name) || [];
        return !shouldFilterImage(tagNames, blacklistedTags);
      });
    }

    // Filter AI-generated images if disabled
    if (this.disableAiPosts) {
      const beforeCount = images.length;
      images = images.filter(img => !this.hasAiTags(img));
      const filteredCount = beforeCount - images.length;
      if (filteredCount > 0) {
        console.log(`[TBIB] Filtered out ${filteredCount} AI-generated image(s)`);
      }
    }

    return images;
  }
}

/**
 * Singleton instance for convenience
 */
let tbibClientInstance: TBIBClient | null = null;

export function initializeTBIBClient(options?: TBIBClientOptions): TBIBClient {
  tbibClientInstance = new TBIBClient(options);
  return tbibClientInstance;
}

export function getTBIBClient(): TBIBClient {
  if (!tbibClientInstance) {
    throw new Error('TBIB client not initialized. Call initializeTBIBClient first.');
  }
  return tbibClientInstance;
}

// Re-export for direct use
export { tbibClientInstance as tbibClient };
