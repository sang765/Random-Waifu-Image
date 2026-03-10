/**
 * yande.re API client for fetching anime images
 * API Documentation: https://yande.re/help/api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  YandePost,
  YandeFetchOptions,
  YandeRating,
  isNsfwRating,
  parseTagString,
  parseYandeTags,
} from '../types/yande';
import { SourceImage, WaifuSource } from '../types/source';
import { getBlacklistedTagsByKey, shouldFilterImage } from '../utils/blacklist';

export interface YandeCredentials {
  username: string;
  passwordHash: string;
}

export class YandeClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://yande.re';
  private readonly credentials?: YandeCredentials;
  readonly name = 'yande.re';

  /**
   * Track last request time for rate limiting
   * yande.re is more strict with rate limiting
   */
  private lastRequestTime: number = 0;
  private readonly minRequestInterval = 500; // 500ms = 2 req/sec (more conservative)

  constructor(credentials?: YandeCredentials) {
    this.credentials = credentials;
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
   * Convert yande.re post to unified SourceImage format
   */
  private normalizeImage(post: YandePost): SourceImage {
    // Parse all tags
    const tags = parseTagString(post.tags).map(name => ({ name }));
    
    // Parse tags into categories
    const parsedTags = parseYandeTags(post.tags);
    
    // Determine if NSFW based on rating
    const isNsfw = isNsfwRating(post.rating);

    // Determine the best URL to use
    // Prefer file_url (original), then jpeg_url, then sample_url
    const url = post.file_url || post.jpeg_url || post.sample_url || '';

    // Map yande.re rating to our ContentRating
    const ratingMap: Record<YandeRating, 'safe' | 'suggestive' | 'borderline' | 'explicit'> = {
      's': 'safe',
      'q': 'borderline',
      'e': 'explicit',
    };

    // Build yande.re post URL
    const postUrl = `https://yande.re/post/${post.id}`;

    return {
      id: post.id,
      url,
      width: post.width,
      height: post.height,
      source: post.source || null,
      artists: post.author ? [{ name: post.author, url: null }] : undefined,
      tags: tags.length > 0 ? tags : undefined,
      isNsfw,
      rating: ratingMap[post.rating],
      characters: parsedTags.characters.length > 0 ? parsedTags.characters : undefined,
      fileSize: post.file_size,
      favorites: undefined, // yande.re doesn't expose favorites in post
      createdAt: new Date(post.created_at * 1000).toISOString(),
      contentHash: post.md5,
      score: post.score,
      upvotes: post.score > 0 ? post.score : undefined, // yande.re doesn't separate up/down
      downvotes: post.score < 0 ? Math.abs(post.score) : undefined,
      copyright: parsedTags.copyright.length > 0 ? parsedTags.copyright : undefined,
      generalTags: parsedTags.general.length > 0 ? parsedTags.general : undefined,
      fileExt: post.file_ext,
      postUrl,
    };
  }

  /**
   * Get blacklisted tags for yande.re
   */
  private getBlacklistedTags(): string[] {
    return getBlacklistedTagsByKey('yande.re');
  }

  /**
   * Build search tags string from options
   * Automatically includes blacklisted tags as negated tags (-tag_name)
   */
  private buildTags(options: YandeFetchOptions): string {
    const tags: string[] = [];

    // Add user-provided tags
    if (options.tags) {
      if (Array.isArray(options.tags)) {
        tags.push(...options.tags);
      } else {
        tags.push(options.tags);
      }
    }

    // Add rating filter if specified
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
   * Fetch posts from yande.re API
   */
  async fetchPosts(options: YandeFetchOptions = {}): Promise<YandePost[]> {
    await this.enforceRateLimit();

    const params = new URLSearchParams();

    // Add authentication if available
    if (this.credentials) {
      params.append('login', this.credentials.username);
      params.append('password_hash', this.credentials.passwordHash);
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

    // Add limit (max 100)
    const limit = Math.min(100, Math.max(1, options.limit ?? 1));
    params.append('limit', limit.toString());

    // Add pagination
    if (options.page !== undefined) {
      params.append('page', options.page.toString());
    }

    try {
      const response = await this.client.get<YandePost[]>(
        `/post.json?${params.toString()}`
      );

      // Filter out posts without visible file URLs
      return (response.data || []).filter(post => post.file_url);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('yande.re API error:', axiosError.message);
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
  async fetchPostById(id: number): Promise<YandePost | null> {
    await this.enforceRateLimit();

    const params = new URLSearchParams();

    // Add authentication if available
    if (this.credentials) {
      params.append('login', this.credentials.username);
      params.append('password_hash', this.credentials.passwordHash);
    }

    try {
      const response = await this.client.get<YandePost>(
        `/post/${id}.json?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(`Failed to fetch post ${id}:`, axiosError.message);
      return null;
    }
  }

  /**
   * Fetch random SFW images (rating:s for safe)
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    const posts = await this.fetchPosts({
      tags,
      rating: 's', // Safe rating is SFW
      random: true,
      limit: 1,
    });

    if (posts.length === 0) return null;
    return this.normalizeImage(posts[0]);
  }

  /**
   * Fetch random NSFW images (rating:q for questionable, rating:e for explicit)
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
  async fetchImages(options: YandeFetchOptions = {}): Promise<SourceImage[]> {
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
let yandeClientInstance: YandeClient | null = null;

export function initializeYandeClient(credentials?: YandeCredentials): YandeClient {
  yandeClientInstance = new YandeClient(credentials);
  return yandeClientInstance;
}

export function getYandeClient(): YandeClient {
  if (!yandeClientInstance) {
    throw new Error('yande.re client not initialized. Call initializeYandeClient first.');
  }
  return yandeClientInstance;
}

// Re-export for direct use
export { yandeClientInstance as yandeClient };
