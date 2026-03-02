/**
 * Type definitions for waifu.im API responses
 * API Documentation: https://docs.waifu.im/docs/getting-started
 */

export interface Artist {
  id: number;
  name: string;
  patreon: string | null;
  pixiv: string | null;
  twitter: string | null;
  deviantArt: string | null;
  reviewStatus: string;
  creatorId: number | null;
  imageCount: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string;
  reviewStatus: string;
  creatorId: number | null;
  imageCount: number;
}

export interface WaifuImage {
  id: number;
  perceptualHash: string;
  extension: string;
  dominantColor: string;
  source: string | null;
  artists: Artist[];
  uploaderId: number | null;
  uploadedAt: string;
  isNsfw: boolean;
  isAnimated: boolean;
  width: number;
  height: number;
  byteSize: number;
  url: string;
  tags: Tag[];
  reviewStatus: string;
  favorites: number;
  likedAt: string | null;
  addedToAlbumAt: string | null;
  albums: string[];
}

export interface WaifuApiResponse {
  items: WaifuImage[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  maxPageSize: number;
  defaultPageSize: number;
}

export interface WaifuApiError {
  message: string;
  status: number;
}

export type NsfwFilter = 'true' | 'false' | 'all';

export interface WaifuFetchOptions {
  includedTags?: string[];
  excludedTags?: string[];
  isNsfw?: NsfwFilter;
  limit?: number;
  page?: number;
}
