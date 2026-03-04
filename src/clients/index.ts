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
  Rule34Client,
  initializeRule34Client,
  getRule34Client,
  rule34Client,
  type Rule34Credentials,
} from './rule34-client';
export {
  TBIBClient,
  initializeTBIBClient,
  getTBIBClient,
  tbibClient,
  type TBIBClientOptions,
} from './tbib-client';

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
