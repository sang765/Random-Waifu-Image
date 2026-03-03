/**
 * Type definitions for nekos.best API
 * API Documentation: https://docs.nekos.best/
 */

/** Image categories available on nekos.best */
export type NekosBestImageCategory = 'neko' | 'waifu' | 'husbando' | 'kitsune';

/** GIF categories available on nekos.best */
export type NekosBestGifCategory =
  | 'lurk'
  | 'shoot'
  | 'sleep'
  | 'clap'
  | 'shrug'
  | 'stare'
  | 'wave'
  | 'poke'
  | 'confused'
  | 'smile'
  | 'peck'
  | 'wink'
  | 'sip'
  | 'blush'
  | 'smug'
  | 'tickle'
  | 'yeet'
  | 'think'
  | 'highfive'
  | 'feed'
  | 'wag'
  | 'bite'
  | 'teehee'
  | 'shocked'
  | 'bleh'
  | 'bored'
  | 'nom'
  | 'nya'
  | 'yawn'
  | 'facepalm'
  | 'cuddle'
  | 'kick'
  | 'happy'
  | 'carry'
  | 'hug'
  | 'kabedon'
  | 'baka'
  | 'bonk'
  | 'pat'
  | 'angry'
  | 'spin'
  | 'shake'
  | 'run'
  | 'nod'
  | 'nope'
  | 'kiss'
  | 'dance'
  | 'punch'
  | 'handshake'
  | 'slap'
  | 'cry'
  | 'lappillow'
  | 'pout'
  | 'blowkiss'
  | 'handhold'
  | 'salute'
  | 'laugh'
  | 'tableflip';

/** All available categories */
export type NekosBestCategory = NekosBestImageCategory | NekosBestGifCategory;

/** Category format information */
export interface NekosBestCategoryInfo {
  format: 'png' | 'gif';
}

/** Response from /endpoints endpoint */
export type NekosBestEndpointsResponse = Record<NekosBestCategory, NekosBestCategoryInfo>;

/** Individual result item from /:category endpoint */
export interface NekosBestResult {
  /** Artist name (for images) */
  artist_name?: string;
  /** Artist URL (for images) */
  artist_href?: string;
  /** Source URL where the image was found */
  source_url?: string;
  /** Direct URL to the image/GIF */
  url: string;
  /** Anime name (for GIFs) */
  anime_name?: string;
}

/** Response from /:category endpoint */
export interface NekosBestResponse {
  /** Array of results */
  results: NekosBestResult[];
}

/** Query parameters for fetching images */
export interface NekosBestFetchOptions {
  /** Number of results to return (1-20) */
  amount?: number;
}

/** SFW categories (safe for work) - includes all categories as nekos.best is SFW-only */
export const NEKOS_BEST_SFW_CATEGORIES: NekosBestCategory[] = [
  // Image categories
  'neko',
  'waifu',
  'husbando',
  'kitsune',
  // GIF categories
  'lurk',
  'shoot',
  'sleep',
  'clap',
  'shrug',
  'stare',
  'wave',
  'poke',
  'confused',
  'smile',
  'peck',
  'wink',
  'sip',
  'blush',
  'smug',
  'tickle',
  'yeet',
  'think',
  'highfive',
  'feed',
  'wag',
  'bite',
  'teehee',
  'shocked',
  'bleh',
  'bored',
  'nom',
  'nya',
  'yawn',
  'facepalm',
  'cuddle',
  'kick',
  'happy',
  'carry',
  'hug',
  'kabedon',
  'baka',
  'bonk',
  'pat',
  'angry',
  'spin',
  'shake',
  'run',
  'nod',
  'nope',
  'kiss',
  'dance',
  'punch',
  'handshake',
  'slap',
  'cry',
  'lappillow',
  'pout',
  'blowkiss',
  'handhold',
  'salute',
  'laugh',
  'tableflip',
];

/** Image categories (PNG format) */
export const NEKOS_BEST_IMAGE_CATEGORIES: NekosBestImageCategory[] = [
  'neko',
  'waifu',
  'husbando',
  'kitsune',
];

/** GIF categories */
export const NEKOS_BEST_GIF_CATEGORIES: NekosBestGifCategory[] = [
  'lurk',
  'shoot',
  'sleep',
  'clap',
  'shrug',
  'stare',
  'wave',
  'poke',
  'confused',
  'smile',
  'peck',
  'wink',
  'sip',
  'blush',
  'smug',
  'tickle',
  'yeet',
  'think',
  'highfive',
  'feed',
  'wag',
  'bite',
  'teehee',
  'shocked',
  'bleh',
  'bored',
  'nom',
  'nya',
  'yawn',
  'facepalm',
  'cuddle',
  'kick',
  'happy',
  'carry',
  'hug',
  'kabedon',
  'baka',
  'bonk',
  'pat',
  'angry',
  'spin',
  'shake',
  'run',
  'nod',
  'nope',
  'kiss',
  'dance',
  'punch',
  'handshake',
  'slap',
  'cry',
  'lappillow',
  'pout',
  'blowkiss',
  'handhold',
  'salute',
  'laugh',
  'tableflip',
];
