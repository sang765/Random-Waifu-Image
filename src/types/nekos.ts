/**
 * Type definitions for NekosAPI (nekosapi.com)
 * API Documentation: https://nekosapi.com/docs
 */

export interface NekosArtist {
  id: number;
  name: string;
  url?: string | null;
}

export interface NekosCharacter {
  id: number;
  name: string;
}

export interface NekosTag {
  id: number;
  name: string;
  description: string;
  is_nsfw: boolean;
}

export interface NekosImage {
  id: number;
  url: string;
  nsfw: boolean;
  /** Age rating: safe, suggestive, borderline, explicit */
  rating: 'safe' | 'suggestive' | 'borderline' | 'explicit';
  description: string | null;
  width: number;
  height: number;
  source: string | null;
  created_at: string;
  updated_at: string;
  artist: NekosArtist | null;
  characters: NekosCharacter[];
  tags: NekosTag[];
}

export interface NekosApiResponse {
  /** Array of image objects */
  items: NekosImage[];
  /** Total number of items matching the query (not just returned) */
  count: number;
}

export interface NekosApiError {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

/** Age rating filter options */
export type NekosRating = 'safe' | 'suggestive' | 'borderline' | 'explicit';

export interface NekosFetchOptions {
  /** Age ratings to include (comma-delimited: safe,suggestive,borderline,explicit) */
  rating?: NekosRating[];
  /** Artist IDs to filter by */
  artist?: number[];
  /** Tag names to include (comma-delimited) */
  tags?: string[];
  /** Tag names to exclude (comma-delimited) */
  without_tags?: string[];
  /** Number of images to return (1-100) */
  limit?: number;
  /** Number of images to skip (for pagination) */
  offset?: number;
}
