/**
 * Waifu.im API client for fetching anime images
 * API Documentation: https://docs.waifu.im/docs/getting-started
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  WaifuApiResponse,
  WaifuImage,
  WaifuFetchOptions,
  NsfwFilter,
} from '../types/waifu';
import { SourceImage, WaifuSource } from '../types/source';
import { getBlacklistedTagsByKey, shouldFilterImage } from '../utils/blacklist';

export class WaifuClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.waifu.im';
  readonly name = 'waifu.im';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      },
    });
  }

  /**
   * Convert waifu.im image to unified SourceImage format
   */
  private normalizeImage(image: WaifuImage): SourceImage {
    return {
      id: image.id,
      url: image.url,
      width: image.width,
      height: image.height,
      source: image.source,
      artists: image.artists?.map(artist => ({
        name: artist.name,
        url: artist.pixiv || undefined,
      })) || [],
      tags: image.tags?.map(tag => ({ name: tag.name })) || [],
      isNsfw: image.isNsfw,
      dominantColor: image.dominantColor,
      isAnimated: image.isAnimated,
      fileSize: image.byteSize,
      favorites: image.favorites,
      createdAt: image.uploadedAt,
    };
  }

  /**
   * Get blacklisted tags for waifu.im
   */
  private getBlacklistedTags(): string[] {
    return getBlacklistedTagsByKey('waifuim');
  }

  /**
   * Fetch random images from waifu.im API
   * Automatically excludes blacklisted tags
   */
  async fetchImages(options: WaifuFetchOptions = {}): Promise<SourceImage[]> {
    const params = new URLSearchParams();

    // Add included tags
    if (options.includedTags && options.includedTags.length > 0) {
      options.includedTags.forEach(tag => {
        params.append('IncludedTags', tag);
      });
    }

    // Add excluded tags (user-provided + blacklisted)
    const blacklistedTags = this.getBlacklistedTags();
    const excludedTags = [...(options.excludedTags || [])];
    for (const tag of blacklistedTags) {
      if (!excludedTags.includes(tag)) {
        excludedTags.push(tag);
      }
    }
    if (excludedTags.length > 0) {
      excludedTags.forEach(tag => {
        params.append('ExcludedTags', tag);
      });
    }

    // Add NSFW filter (default to false for SFW content)
    if (options.isNsfw) {
      params.append('IsNsfw', options.isNsfw);
    } else {
      params.append('IsNsfw', 'false');
    }

    // Add pagination
    const limit = options.limit ?? 1;
    params.append('PageSize', limit.toString());
    
    if (options.page) {
      params.append('Page', options.page.toString());
    }

    try {
      const response = await this.client.get<WaifuApiResponse>(`/images?${params.toString()}`);
      const images = response.data.items.map(img => this.normalizeImage(img));

      // Filter out images with blacklisted tags as a safety measure
      if (blacklistedTags.length > 0) {
        return images.filter(image => {
          const tagNames = image.tags?.map(tag => tag.name) || [];
          return !shouldFilterImage(tagNames, blacklistedTags);
        });
      }

      return images;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const responseData = axiosError.response.data as { message?: string } | undefined;
        throw new Error(
          `Waifu.im API error: ${axiosError.response.status} - ${
            responseData?.message || axiosError.message
          }`
        );
      }
      throw new Error(`Failed to fetch images: ${axiosError.message}`);
    }
  }

  /**
   * Fetch a single random SFW image
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    const images = await this.fetchImages({
      includedTags: tags,
      isNsfw: 'false',
      limit: 1,
    });
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Fetch a single random NSFW image
   */
  async fetchRandomNsfw(tags?: string[]): Promise<SourceImage | null> {
    const images = await this.fetchImages({
      includedTags: tags,
      isNsfw: 'true',
      limit: 1,
    });
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Fetch available tags from the API
   */
  async fetchTags(): Promise<{ id: number; name: string; slug: string }[]> {
    try {
      const response = await this.client.get('/tags');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(`Failed to fetch tags: ${axiosError.message}`);
    }
  }
}

// Export singleton instance
export const waifuClient = new WaifuClient();
