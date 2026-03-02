/**
 * Type definitions for waifu.pics API
 * API Documentation: https://waifu.pics/docs
 */

export interface WaifuPicsImage {
  /** Direct URL to the image */
  url: string;
}

export interface WaifuPicsManyResponse {
  /** Array of image URLs */
  files: string[];
}

export interface WaifuPicsManyRequest {
  /** List of URLs to exclude from the response */
  exclude?: string[];
}

/** SFW categories available on waifu.pics */
export type WaifuPicsSfwCategory =
  | 'waifu'
  | 'neko'
  | 'shinobu'
  | 'megumin'
  | 'bully'
  | 'cuddle'
  | 'cry'
  | 'hug'
  | 'awoo'
  | 'kiss'
  | 'lick'
  | 'pat'
  | 'smug'
  | 'bonk'
  | 'yeet'
  | 'blush'
  | 'smile'
  | 'wave'
  | 'highfive'
  | 'handhold'
  | 'nom'
  | 'bite'
  | 'glomp'
  | 'slap'
  | 'kill'
  | 'kick'
  | 'happy'
  | 'wink'
  | 'poke'
  | 'dance'
  | 'cringe';

/** NSFW categories available on waifu.pics */
export type WaifuPicsNsfwCategory = 'waifu' | 'neko' | 'trap' | 'blowjob';

/** All available categories */
