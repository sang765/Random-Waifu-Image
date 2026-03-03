/**
 * Waifu.pics API client for fetching anime images
 * API Documentation: https://waifu.pics/docs
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SourceImage, WaifuSource } from '../types/source';
import {
  WaifuPicsImage,
  WaifuPicsManyResponse,
  WaifuPicsSfwCategory,
  WaifuPicsNsfwCategory,
} from '../types/waifupics';

export class WaifuPicsClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.waifu.pics';
  readonly name = 'waifu.pics';

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
   * Convert waifu.pics URL to unified SourceImage format
   */
  private normalizeImage(url: string): SourceImage {
    // Extract a pseudo-ID from the URL filename
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const id = filename.replace(/\.[^/.]+$/, ''); // Remove extension

    return {
      id: id,
      url: url,
      isNsfw: false, // Will be set based on context
      // waifu.pics doesn't provide these details
      width: undefined,
      height: undefined,
      source: null,
      artists: [],
      tags: [],
      dominantColor: undefined,
    };
  }

  /**
   * Fetch a single random image from a category
   */
  async fetchImage(
    type: 'sfw' | 'nsfw',
    category: WaifuPicsSfwCategory | WaifuPicsNsfwCategory
  ): Promise<SourceImage | null> {
    try {
      const response = await this.client.get<WaifuPicsImage>(`/${type}/${category}`);
      const image = this.normalizeImage(response.data.url);
      image.isNsfw = type === 'nsfw';
      return image;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `waifu.pics API error: ${axiosError.response?.status || 'unknown'} - ${axiosError.message}`
      );
    }
  }

  /**
   * Fetch multiple images from a category
   */
  async fetchManyImages(
    type: 'sfw' | 'nsfw',
    category: WaifuPicsSfwCategory | WaifuPicsNsfwCategory,
    exclude?: string[]
  ): Promise<SourceImage[]> {
    try {
      const response = await this.client.post<WaifuPicsManyResponse>(
        `/many/${type}/${category}`,
        { exclude }
      );
      return response.data.files.map(url => {
        const image = this.normalizeImage(url);
        image.isNsfw = type === 'nsfw';
        return image;
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `waifu.pics API error: ${axiosError.response?.status || 'unknown'} - ${axiosError.message}`
      );
    }
  }

  /**
   * Fetch a single random SFW image
   * Uses the 'waifu' category by default, or picks from provided tags
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    // If tags provided, try to use one as category, otherwise default to 'waifu'
    const category = tags && tags.length > 0
      ? (tags[0] as WaifuPicsSfwCategory)
      : 'waifu';
    
    return this.fetchImage('sfw', category);
  }

  /**
   * Fetch a single random NSFW image
   * Uses the 'waifu' category by default, or picks from provided tags
   */
  async fetchRandomNsfw(tags?: string[]): Promise<SourceImage | null> {
    // If tags provided, try to use one as category, otherwise default to 'waifu'
    const category = tags && tags.length > 0
      ? (tags[0] as WaifuPicsNsfwCategory)
      : 'waifu';
    
    return this.fetchImage('nsfw', category);
  }
}

// Export singleton instance
export const waifuPicsClient = new WaifuPicsClient();
