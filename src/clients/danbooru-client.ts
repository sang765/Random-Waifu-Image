/**
 * Danbooru API client for fetching anime images
 * API Documentation: https://danbooru.donmai.us/wiki_pages/help:api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  DanbooruPost,
  DanbooruFetchOptions,
  DanbooruRating,
  isNsfwRating,
  parseTagString,
} from '../types/danbooru';
import { SourceImage, WaifuSource } from '../types/source';
import { getBlacklistedTagsByKey, shouldFilterImage } from '../utils/blacklist';

export interface DanbooruCredentials {
  username: string;
  apiKey: string;
}

export class DanbooruClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://danbooru.donmai.us';
  private readonly credentials?: DanbooruCredentials;
  readonly name = 'danbooru';

  /**
   * Track last request time for rate limiting (10 requests per second max)
   */
  private lastRequestTime: number = 0;
  private readonly minRequestInterval = 100; // 100ms = 10 req/sec

  constructor(credentials?: DanbooruCredentials) {
    this.credentials = credentials;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // Danbooru can be slow sometimes
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
          await this.delay(1000);
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
   * Enforce rate limiting - ensure we don't exceed 10 requests per second
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
   * Convert Danbooru post to unified SourceImage format
   */
  private normalizeImage(post: DanbooruPost): SourceImage {
    // Parse artists from tag_string_artist
    const artists = parseTagString(post.tag_string_artist).map(name => ({
      name,
      url: null, // Danbooru doesn't provide direct artist URLs in post data
    }));

    // Parse all tags
    const tags = parseTagString(post.tag_string).map(name => ({ name }));

    // Parse character names
    const characters = parseTagString(post.tag_string_character);

    // Determine if NSFW based on rating
    const isNsfw = isNsfwRating(post.rating);

    // Determine the best URL to use
    // Prefer large_file_url if available, otherwise file_url
    const url = post.large_file_url || post.file_url || '';

    // Map Danbooru rating to our ContentRating
    const ratingMap: Record<DanbooruRating, 'safe' | 'suggestive' | 'borderline' | 'explicit'> = {
      'g': 'safe',
      's': 'suggestive',
      'q': 'borderline',
      'e': 'explicit',
    };

    // Parse copyright/series tags
    const copyright = parseTagString(post.tag_string_copyright);

    // Parse general tags
    const generalTags = parseTagString(post.tag_string_general);

    // Parse meta tags
    const metaTags = parseTagString(post.tag_string_meta);

    // Build Danbooru post URL
    const postUrl = `https://danbooru.donmai.us/posts/${post.id}`;

    return {
      id: post.id,
      url,
      width: post.image_width,
      height: post.image_height,
      source: post.source || null,
      artists: artists.length > 0 ? artists : undefined,
      tags: tags.length > 0 ? tags : undefined,
      isNsfw,
      rating: ratingMap[post.rating],
      characters: characters.length > 0 ? characters : undefined,
      fileSize: post.file_size,
      favorites: post.fav_count,
      createdAt: post.created_at,
      contentHash: post.md5,
      score: post.score,
      upvotes: post.up_score,
      downvotes: post.down_score,
      copyright: copyright.length > 0 ? copyright : undefined,
      generalTags: generalTags.length > 0 ? generalTags : undefined,
      metaTags: metaTags.length > 0 ? metaTags : undefined,
      fileExt: post.file_ext,
      postUrl,
    };
  }

  /**
   * Get blacklisted tags for Danbooru
   */
  private getBlacklistedTags(): string[] {
    return getBlacklistedTagsByKey('danbooru');
  }

  /**
   * Build search tags string from options
   * Automatically includes blacklisted tags as negated tags (-tag_name)
   */
  private buildTags(options: DanbooruFetchOptions): string {
    const tags: string[] = [];

    // Add user-provided tags
    if (options.tags) {
      if (Array.isArray(options.tags)) {
        tags.push(...options.tags);
      } else {
        tags.push(options.tags);
      }
    }

    // Add rating filter if specified (simplified - only single rating supported)
    if (options.rating && !Array.isArray(options.rating)) {
      tags.push(`rating:${options.rating}`);
    }

    // Add blacklisted tags as negated tags
    const blacklistedTags = this.getBlacklistedTags();
    for (const tag of blacklistedTags) {
      tags.push(`-${tag}`);
    }

    return tags.join(' ');
  }

  /**
   * Fetch posts from Danbooru API
   */
  async fetchPosts(options: DanbooruFetchOptions = {}): Promise<DanbooruPost[]> {
    await this.enforceRateLimit();

    const params = new URLSearchParams();

    // Add authentication if available
    if (this.credentials) {
      params.append('login', this.credentials.username);
      params.append('api_key', this.credentials.apiKey);
    }

    // Add MD5 search (takes priority)
    if (options.md5) {
      params.append('md5', options.md5);
    } else {
      // Add tags
      const tags = this.buildTags(options);
      if (tags) {
        params.append('tags', tags);
      }

      // Add random flag
      if (options.random) {
        params.append('random', 'true');
      }
    }

    // Add limit (max 200)
    const limit = Math.min(200, Math.max(1, options.limit ?? 1));
    params.append('limit', limit.toString());

    // Add pagination
    if (options.page !== undefined) {
      params.append('page', options.page.toString());
    }

    try {
      const response = await this.client.get<DanbooruPost[]>(
        `/posts.json?${params.toString()}`
      );

      // Filter out posts without visible file URLs
      return (response.data || []).filter(post => post.file_url);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Danbooru API error:', axiosError.message);
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
  async fetchPostById(id: number): Promise<DanbooruPost | null> {
    await this.enforceRateLimit();

    const params = new URLSearchParams();

    // Add authentication if available
    if (this.credentials) {
      params.append('login', this.credentials.username);
      params.append('api_key', this.credentials.apiKey);
    }

    try {
      const response = await this.client.get<DanbooruPost>(
        `/posts/${id}.json?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Failed to fetch post ${id}:`, axiosError.message);
      return null;
    }
  }

  /**
   * Fetch random SFW images (rating:g for general/safe)
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    const posts = await this.fetchPosts({
      tags,
      rating: 'g', // General rating is SFW
      random: true,
      limit: 1,
    });

    if (posts.length === 0) return null;
    return this.normalizeImage(posts[0]);
  }

  /**
   * Fetch random NSFW images (rating:q for questionable)
   */
  async fetchRandomNsfw(tags?: string[]): Promise<SourceImage | null> {
    const posts = await this.fetchPosts({
      tags,
      rating: 'q', // Questionable rating is NSFW
      random: true,
      limit: 1,
    });

    if (posts.length === 0) return null;
    return this.normalizeImage(posts[0]);
  }

  /**
   * Fetch multiple images with options
   * Results are filtered to exclude images with blacklisted tags
   */
  async fetchImages(options: DanbooruFetchOptions = {}): Promise<SourceImage[]> {
    const posts = await this.fetchPosts(options);
    const images = posts.map(post => this.normalizeImage(post));

    // Filter out images with blacklisted tags as a safety measure
    const blacklistedTags = this.getBlacklistedTags();
    if (blacklistedTags.length > 0) {
      return images.filter(image => {
        const tagNames = image.tags?.map(tag => tag.name) || [];
        return !shouldFilterImage(tagNames, blacklistedTags);
      });
    }

    return images;
  }
}

/**
 * Singleton instance for convenience
 * Credentials should be provided from config
 */
let danbooruClientInstance: DanbooruClient | null = null;

export function initializeDanbooruClient(credentials?: DanbooruCredentials): DanbooruClient {
  danbooruClientInstance = new DanbooruClient(credentials);
  return danbooruClientInstance;
}

export function getDanbooruClient(): DanbooruClient {
  if (!danbooruClientInstance) {
    throw new Error('Danbooru client not initialized. Call initializeDanbooruClient first.');
  }
  return danbooruClientInstance;
}

// Re-export for direct use
export { danbooruClientInstance as danbooruClient };
