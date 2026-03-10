/**
 * Export all image source clients
 */

export { waifuClient, WaifuClient } from './waifu-client';
export { nekosClient, NekosClient } from './nekos-client';
export { waifuPicsClient, WaifuPicsClient } from './waifu-pics-client';
export { picreClient, PicreClient } from './picre-client';
export { nekosBestClient, NekosBestClient } from './nekos-best-client';
export { DiscordWebhookClient } from './discord-webhook';
export {
  DanbooruClient,
  initializeDanbooruClient,
  getDanbooruClient,
  danbooruClient,
  type DanbooruCredentials,
} from './danbooru-client';
export {
  YandeClient,
  initializeYandeClient,
  getYandeClient,
  yandeClient,
  type YandeCredentials,
} from './yande-client';

// Export blacklist utility for external use
export {
  loadBlacklist,
  clearBlacklistCache,
  getBlacklistedTags,
  getBlacklistedTagsByKey,
  shouldFilterImage,
  filterImagesByTags,
  getSupportedSources,
  supportsTagBlacklisting,
} from '../utils/blacklist';
