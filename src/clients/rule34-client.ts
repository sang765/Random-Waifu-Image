/**
 * Rule 34 API client for fetching anime images
 * API Documentation: https://api.rule34.xxx/index.php
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Rule34Post,
  Rule34FetchOptions,
  Rule34Rating,
  isNsfwRating,
  parseTagString,
} from '../types/rule34';
import { SourceImage, WaifuSource } from '../types/source';
import { getBlacklistedTagsByKey, shouldFilterImage } from '../utils/blacklist';

export interface Rule34Credentials {
  userId: string;
  apiKey: string;
}

export class Rule34Client implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.rule34.xxx';
  private readonly credentials?: Rule34Credentials;
  private readonly disableAiPosts: boolean;
  readonly name = 'rule34';

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

  constructor(credentials?: Rule34Credentials, disableAiPosts: boolean = true) {
    this.credentials = credentials;
    this.disableAiPosts = disableAiPosts;
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
   * Convert Rule 34 post to unified SourceImage format
   */
  private normalizeImage(post: Rule34Post): SourceImage {
    // Parse artists from tags (Rule 34 uses 'artist:' prefix for artist tags)
    const allTags = parseTagString(post.tags);
    const artists = allTags
      .filter(tag => tag.startsWith('artist:'))
      .map(tag => ({
        name: tag.replace('artist:', ''),
        url: null,
      }));

    // Parse character names (Rule 34 uses 'character:' prefix)
    const characters = allTags
      .filter(tag => tag.startsWith('character:'))
      .map(tag => tag.replace('character:', ''));

    // Parse copyright/series (Rule 34 uses copyright: or no prefix for series)
    const copyright = allTags
      .filter(tag => tag.startsWith('copyright:'))
      .map(tag => tag.replace('copyright:', ''));

    // Determine if NSFW based on rating
    const isNsfw = isNsfwRating(post.rating);

    // Map Rule 34 rating to our ContentRating
    const ratingMap: Record<Rule34Rating, 'safe' | 'suggestive' | 'borderline' | 'explicit'> = {
      'safe': 'safe',
      'questionable': 'borderline',
      'explicit': 'explicit',
    };

    // Build Rule 34 post URL
    const postUrl = `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`;

    return {
      id: post.id,
      url: post.file_url,
      width: post.width,
      height: post.height,
      source: post.source || null,
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
   * Get blacklisted tags for Rule 34
   */
  private getBlacklistedTags(): string[] {
    return getBlacklistedTagsByKey('rule34');
  }

  /**
   * Build search tags string from options
   * Automatically includes blacklisted tags as negated tags (-tag_name)
   */
  private buildTags(options: Rule34FetchOptions): string {
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
   * Fetch posts from Rule 34 API
   */
  async fetchPosts(options: Rule34FetchOptions = {}): Promise<Rule34Post[]> {
    await this.enforceRateLimit();

    const params = new URLSearchParams();
    
    // Required parameters
    params.append('page', 'dapi');
    params.append('s', 'post');
    params.append('q', 'index');
    params.append('json', '1');

    // Add authentication if available
    if (this.credentials) {
      params.append('user_id', this.credentials.userId);
      params.append('api_key', this.credentials.apiKey);
    }

    // Add specific post ID if provided
    if (options.id) {
      params.append('id', options.id.toString());
    } else {
      // Add tags
      const tags = this.buildTags(options);
      if (tags) {
        params.append('tags', tags);
      }

      // Add limit (max 1000)
      const limit = Math.min(1000, Math.max(1, options.limit ?? 1));
      params.append('limit', limit.toString());

      // Add pagination (PID = page ID)
      if (options.page !== undefined && options.page > 0) {
        params.append('pid', options.page.toString());
      }

      // Add change ID if provided
      if (options.changeId) {
        params.append('cid', options.changeId.toString());
      }

      // Add deleted flag if requested
      if (options.deleted) {
        params.append('deleted', 'show');
      }
    }

    try {
      const response = await this.client.get<Rule34Post[]>(
        `/index.php?${params.toString()}`
      );

      // Rule 34 API returns an array directly when json=1
      const posts = Array.isArray(response.data) ? response.data : [];
      
      // Filter out posts without file URLs
      return posts.filter(post => post.file_url);
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Rule 34 API error:', axiosError.message);
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
  async fetchPostById(id: number): Promise<Rule34Post | null> {
    const posts = await this.fetchPosts({ id });
    return posts.length > 0 ? posts[0] : null;
  }

  /**
   * Fetch random SFW images
   * Note: Rule 34 is primarily NSFW, so this returns null
   * as there is virtually no SFW content on the platform
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    // Rule 34 does not have SFW content (it's an adult content site)
    // Return null to trigger fallback to other sources
    console.log('[Rule34] SFW requested but Rule 34 only provides NSFW content');
    return null;
  }

  /**
   * Fetch random NSFW images
   * Rule 34 is primarily NSFW content
   */
  async fetchRandomNsfw(tags?: string[]): Promise<SourceImage | null> {
    // Fetch posts without rating filter - Rule 34 content is primarily explicit
    const posts = await this.fetchPosts({
      tags: tags || ['1girl'], // Default to 1girl if no tags specified
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
        console.log(`[Rule34] Filtered out ${filteredCount} AI-generated image(s)`);
      }
    }

    if (images.length === 0) {
      console.log('[Rule34] All images were AI-generated (filtered out). Retrying...');
      return null;
    }
    
    // Pick a random post from the results
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }

  /**
   * Fetch multiple images with options
   * Results are filtered to exclude images with blacklisted tags
   * Also filters AI-generated images if R34_DISABLE_AI_POST is true
   */
  async fetchImages(options: Rule34FetchOptions = {}): Promise<SourceImage[]> {
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
        console.log(`[Rule34] Filtered out ${filteredCount} AI-generated image(s)`);
      }
    }

    return images;
  }
}

/**
 * Singleton instance for convenience
 * Credentials should be provided from config
 */
let rule34ClientInstance: Rule34Client | null = null;

export function initializeRule34Client(credentials?: Rule34Credentials, disableAiPosts?: boolean): Rule34Client {
  rule34ClientInstance = new Rule34Client(credentials, disableAiPosts);
  return rule34ClientInstance;
}

export function getRule34Client(): Rule34Client {
  if (!rule34ClientInstance) {
    throw new Error('Rule 34 client not initialized. Call initializeRule34Client first.');
  }
  return rule34ClientInstance;
}

// Re-export for direct use
export { rule34ClientInstance as rule34Client };
