/**
 * NekosAPI (nekosapi.com) client for fetching anime images
 * API Documentation: https://nekosapi.com/docs
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  NekosApiResponse,
  NekosImage,
  NekosFetchOptions,
  NekosRating,
} from '../types/nekos';
import { SourceImage, WaifuSource } from '../types/source';

export class NekosClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.nekosapi.com/v4';
  readonly name = 'Nekos API';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'random-waifu-discord/1.0.0',
      },
    });
  }

  /**
   * Convert NekosAPI image to unified SourceImage format
   */
  private normalizeImage(image: NekosImage): SourceImage {
    return {
      id: image.id,
      url: image.url,
      width: image.width,
      height: image.height,
      source: image.source,
      artists: image.artist ? [{ name: image.artist.name, url: image.artist.url }] : [],
      tags: image.tags?.map(tag => ({ name: tag.name })) || [],
      isNsfw: image.nsfw || image.rating === 'explicit' || image.rating === 'borderline',
      dominantColor: undefined, // NekosAPI doesn't provide dominant color
    };
  }

  /**
   * Fetch random images from NekosAPI
   */
  async fetchImages(options: NekosFetchOptions = {}): Promise<SourceImage[]> {
    const params = new URLSearchParams();

    // Add rating filter based on NSFW preference
    if (options.rating && options.rating.length > 0) {
      params.append('rating', options.rating.join(','));
    }

    // Add artist filter
    if (options.artist && options.artist.length > 0) {
      params.append('artist', options.artist.join(','));
    }

    // Add included tags
    if (options.tags && options.tags.length > 0) {
      params.append('tags', options.tags.join(','));
    }

    // Add excluded tags
    if (options.without_tags && options.without_tags.length > 0) {
      params.append('without_tags', options.without_tags.join(','));
    }

    // Add limit
    const limit = Math.min(100, Math.max(1, options.limit ?? 1));
    params.append('limit', limit.toString());

    // Add offset for pagination
    if (options.offset !== undefined) {
      params.append('offset', options.offset.toString());
    }

    try {
      const response = await this.client.get<NekosApiResponse | NekosImage[]>(
        `/images/random?${params.toString()}`
      );
      // Handle both formats: { items: [...], count: number } or NekosImage[]
      let images: NekosImage[];
      if (Array.isArray(response.data)) {
        images = response.data;
      } else if (response.data && Array.isArray(response.data.items)) {
        images = response.data.items;
      } else {
        return [];
      }
      return images.map(img => this.normalizeImage(img));
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const responseData = axiosError.response.data as { detail?: string } | undefined;
        throw new Error(
          `NekosAPI error: ${axiosError.response.status} - ${
            responseData?.detail || axiosError.message
          }`
        );
      }
      throw new Error(`Failed to fetch images from NekosAPI: ${axiosError.message}`);
    }
  }

  /**
   * Fetch a single random SFW image
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    const images = await this.fetchImages({
      tags,
      rating: ['safe'],
      limit: 1,
    });
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Fetch a single random NSFW image
   */
  async fetchRandomNsfw(tags?: string[]): Promise<SourceImage | null> {
    const images = await this.fetchImages({
      tags,
      rating: ['explicit'], // NSFW content
      limit: 1,
    });
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Fetch images with suggestive rating (mild NSFW)
   */
  async fetchRandomSuggestive(tags?: string[]): Promise<SourceImage | null> {
    const images = await this.fetchImages({
      tags,
      rating: ['suggestive'],
      limit: 1,
    });
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Fetch images with borderline rating (moderate NSFW)
   */
  async fetchRandomBorderline(tags?: string[]): Promise<SourceImage | null> {
    const images = await this.fetchImages({
      tags,
      rating: ['borderline'],
      limit: 1,
    });
    return images.length > 0 ? images[0] : null;
  }
}

// Export singleton instance
export const nekosClient = new NekosClient();
