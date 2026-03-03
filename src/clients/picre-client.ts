/**
 * Pic.re API client for fetching anime images
 * API Documentation: https://doc.pic.re/usage-shi-yong/api
 *
 * Note: Pic.re is SFW-only by design. NSFW requests will return null.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SourceImage, WaifuSource } from '../types/source';
import { PicreImage, PicreFetchOptions } from '../types/picre';

export class PicreClient implements WaifuSource {
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://pic.re';
  readonly name = 'pic.re';

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
   * Convert Pic.re image to unified SourceImage format
   */
  private normalizeImage(image: PicreImage): SourceImage {
    // Ensure the URL has https:// prefix (pic.re sometimes returns URLs without protocol)
    let imageUrl = image.file_url;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `https://${imageUrl}`;
    }

    return {
      id: image._id,
      url: imageUrl,
      width: image.width,
      height: image.height,
      source: image.source,
      artists: image.author ? [{ name: image.author, url: null }] : [],
      tags: image.tags?.map(tag => ({ name: tag })) || [],
      isNsfw: false, // Pic.re is SFW-only by design
      dominantColor: undefined, // API doesn't provide dominant color
      contentHash: image.md5,
      isAnimated: image.file_url?.toLowerCase().endsWith('.gif') || false,
    };
  }

  /**
   * Fetch random image metadata from Pic.re API
   * Uses POST /image endpoint (returns JSON metadata)
   * Note: GET /images.json returns 405, POST /image is the working endpoint
   */
  async fetchImageMeta(options: PicreFetchOptions = {}): Promise<PicreImage | null> {
    // Build query parameters for the POST request
    const params = new URLSearchParams();

    // Add included tags
    if (options.includedTags && options.includedTags.length > 0) {
      params.append('in', options.includedTags.join(','));
    }

    // Add excluded tags
    if (options.excludedTags && options.excludedTags.length > 0) {
      params.append('nin', options.excludedTags.join(','));
    }

    // Add specific image ID
    if (options.id !== undefined) {
      params.append('id', options.id.toString());
    }

    // Add compression preference (default: true for webp)
    if (options.compress !== undefined) {
      params.append('compress', options.compress.toString());
    } else {
      params.append('compress', 'true');
    }

    // Add size constraints
    if (options.minSize !== undefined) {
      params.append('mix_size', options.minSize.toString());
    }

    if (options.maxSize !== undefined) {
      params.append('max_size', options.maxSize.toString());
    }

    const queryString = params.toString();
    const url = queryString ? `/image?${queryString}` : '/image';

    try {
      // POST to /image returns JSON metadata (same as /images.json would)
      const response = await this.client.post<PicreImage>(url);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const responseData = axiosError.response.data as { message?: string } | undefined;
        throw new Error(
          `Pic.re API error: ${axiosError.response.status} - ${
            responseData?.message || axiosError.message
          }`
        );
      }
      throw new Error(`Failed to fetch image from Pic.re: ${axiosError.message}`);
    }
  }

  /**
   * Fetch a single random SFW image
   * @param tags - Optional tags to filter by
   */
  async fetchRandomSfw(tags?: string[]): Promise<SourceImage | null> {
    try {
      const meta = await this.fetchImageMeta({
        includedTags: tags,
      });

      if (!meta) {
        return null;
      }

      return this.normalizeImage(meta);
    } catch (error) {
      console.error('Error fetching SFW image from Pic.re:', error);
      return null;
    }
  }

  /**
   * Fetch a single random NSFW image
   * Note: Pic.re is SFW-only by design, so this always returns null
   */
  async fetchRandomNsfw(_tags?: string[]): Promise<SourceImage | null> {
    // Pic.re is SFW-only by design - all images are filtered with AI + manual review
    // NSFW content is not available from this source
    console.log('⚠️  Pic.re is SFW-only. NSFW content is not available from this source.');
    return null;
  }

  /**
   * Fetch available tags from the API
   * Returns list of tags with their image counts
   */
  async fetchTags(): Promise<Array<{ name: string; count: number }>> {
    try {
      const response = await this.client.get<Array<{ name: string; count: number }>>('/tags');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(`Failed to fetch tags from Pic.re: ${axiosError.message}`);
    }
  }
}

// Export singleton instance
export const picreClient = new PicreClient();
