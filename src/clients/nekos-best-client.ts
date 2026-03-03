/**
 * Nekos.best API client for fetching anime images and GIFs
 * API Documentation: https://docs.nekos.best/
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SourceImage, WaifuSource } from '../types/source';
import {
  NekosBestResponse,
  NekosBestResult,
  NekosBestCategory,
  NekosBestGifCategory,
  NEKOS_BEST_SFW_CATEGORIES,
  NEKOS_BEST_IMAGE_CATEGORIES,
  NEKOS_BEST_GIF_CATEGORIES,
} from '../types/nekosbest';

export class NekosBestClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://nekos.best/api/v2';
  readonly name = 'nekos.best';

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
   * Check if a category is an image category (PNG format)
   */
  private isImageCategory(category: NekosBestCategory): boolean {
    return NEKOS_BEST_IMAGE_CATEGORIES.includes(category as typeof NEKOS_BEST_IMAGE_CATEGORIES[number]);
  }

  /**
   * Check if a category is a GIF category
   */
  private isGifCategory(category: NekosBestCategory): boolean {
    return NEKOS_BEST_GIF_CATEGORIES.includes(category as typeof NEKOS_BEST_GIF_CATEGORIES[number]);
  }

  /**
   * Convert nekos.best result to unified SourceImage format
   */
  private normalizeImage(result: NekosBestResult): SourceImage {
    // Extract ID from URL (filename without extension)
    const urlParts = result.url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const id = filename.replace(/\.(png|gif)$/, '');

    // Build artists array
    const artists = [];
    if (result.artist_name) {
      artists.push({
        name: result.artist_name,
        url: result.artist_href || null,
      });
    }

    // Determine if it's a GIF based on URL extension
    const isGif = result.url.endsWith('.gif');

    return {
      id: id,
      url: result.url,
      isNsfw: false, // nekos.best is SFW-only
      source: result.source_url || null,
      artists,
      tags: [], // nekos.best doesn't provide tags in the response
      width: undefined,
      height: undefined,
      dominantColor: undefined,
      isAnimated: isGif,
      animeName: result.anime_name,
      rating: 'safe', // nekos.best is SFW-only
    };
  }

  /**
   * Fetch images/GIFs from a specific category
   * @param category - The category to fetch from
   * @param amount - Number of results (1-20, default 1)
   */
  async fetchFromCategory(
    category: NekosBestCategory,
    amount: number = 1
  ): Promise<SourceImage[]> {
    try {
      const validAmount = Math.min(20, Math.max(1, amount));
      const url = `/${category}?amount=${validAmount}`;

      const response = await this.client.get<NekosBestResponse>(url);

      if (!response.data || !Array.isArray(response.data.results)) {
        return [];
      }

      return response.data.results.map(result => this.normalizeImage(result));
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(
          `nekos.best API error: ${axiosError.response.status} - ${axiosError.message}`
        );
      }
      throw new Error(`Failed to fetch from nekos.best: ${axiosError.message}`);
    }
  }

  /**
   * Fetch a single image from a category
   * @param category - The category to fetch from
   */
  async fetchImage(category: NekosBestCategory): Promise<SourceImage | null> {
    const images = await this.fetchFromCategory(category, 1);
    return images.length > 0 ? images[0] : null;
  }

  /**
   * Fetch a single random SFW image
   * nekos.best is SFW-only, so tags are used as category hints
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    // Try to use provided tag as category
    if (tags && tags.length > 0) {
      const category = tags[0].toLowerCase() as NekosBestCategory;
      if (NEKOS_BEST_SFW_CATEGORIES.includes(category)) {
        return this.fetchImage(category);
      }
    }

    // Default: randomly choose between image categories (neko, waifu, husbando, kitsune)
    const randomCategory = NEKOS_BEST_IMAGE_CATEGORIES[
      Math.floor(Math.random() * NEKOS_BEST_IMAGE_CATEGORIES.length)
    ];
    return this.fetchImage(randomCategory);
  }

  /**
   * Fetch a single random NSFW image
   * Note: nekos.best is SFW-only, so this returns null
   */
  async fetchRandomNsfw(_tags?: string[]): Promise<SourceImage | null> {
    // nekos.best is a SFW-only API
    console.log('⚠️ nekos.best does not provide NSFW content');
    return null;
  }

  /**
   * Fetch a random GIF
   * @param tags - Optional tag to use as category hint
   */
  async fetchRandomGif(tags?: string[]): Promise<SourceImage | null> {
    // Try to use provided tag as category
    if (tags && tags.length > 0) {
      const category = tags[0].toLowerCase() as NekosBestGifCategory;
      if (NEKOS_BEST_GIF_CATEGORIES.includes(category)) {
        return this.fetchImage(category);
      }
    }

    // Default: pick random GIF category
    const randomCategory = NEKOS_BEST_GIF_CATEGORIES[
      Math.floor(Math.random() * NEKOS_BEST_GIF_CATEGORIES.length)
    ];
    return this.fetchImage(randomCategory);
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): NekosBestCategory[] {
    return [...NEKOS_BEST_SFW_CATEGORIES];
  }

  /**
   * Get available image categories
   */
  getImageCategories(): typeof NEKOS_BEST_IMAGE_CATEGORIES {
    return [...NEKOS_BEST_IMAGE_CATEGORIES];
  }

  /**
   * Get available GIF categories
   */
  getGifCategories(): typeof NEKOS_BEST_GIF_CATEGORIES {
    return [...NEKOS_BEST_GIF_CATEGORIES];
  }
}

// Export singleton instance
export const nekosBestClient = new NekosBestClient();
