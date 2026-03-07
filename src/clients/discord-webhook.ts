/**
 * Discord Webhook client for sending images to Discord channels
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SourceImage, ContentRating, hexToDecimal } from '../types/source';
import { extractDominantColor } from '../utils/color-extractor';

/**
 * Get emoji and color for content rating
 */
function getRatingInfo(rating: ContentRating): { emoji: string; color: number } {
  switch (rating) {
    case 'safe':
      return { emoji: '🟢', color: 0x57f287 };
    case 'suggestive':
      return { emoji: '🟡', color: 0xfee75c };
    case 'borderline':
      return { emoji: '🟠', color: 0xfea55f };
    case 'explicit':
      return { emoji: '🔴', color: 0xed4245 };
    default:
      return { emoji: '⚪', color: 0xffb6c1 };
  }
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/**
 * Format number with thousands separator
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Get source emoji based on source name
 */
function getSourceEmoji(sourceName: string): string {
  switch (sourceName) {
    case 'waifu.im':
      return '🌸';
    case 'Nekos API':
      return '🐱';
    case 'nekos.best':
      return '⭐';
    case 'waifu.pics':
      return '💜';
    case 'pic.re':
      return '🖼️';
    case 'danbooru':
      return '🔴';
    case 'rule34':
      return '📋';
    case 'tbib':
      return '📚';
    default:
      return '🎴';
  }
}

/**
 * Check if source provides dominant color in API response
 */
function sourceProvidesDominantColor(sourceName: string): boolean {
  return ['waifu.im', 'nekosapi'].includes(sourceName);
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  image?: {
    url: string;
  };
  video?: {
    url: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export class DiscordWebhookClient {
  private readonly client: AxiosInstance;

  constructor(private readonly webhookUrl: string) {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      throw new Error('Invalid Discord webhook URL');
    }

    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Send a simple message to Discord
   */
  async sendMessage(content: string): Promise<void> {
    const payload: DiscordWebhookPayload = { content };
    await this.sendPayload(payload);
  }

  /**
   * Send a waifu image as a rich embed
   */
  async sendWaifuImage(
    image: SourceImage,
    options: {
      includeTags?: boolean;
      includeArtist?: boolean;
      includeSource?: boolean;
      sourceName?: string;
      includeDescription?: boolean;
      includeRating?: boolean;
      includeCharacters?: boolean;
      includeStats?: boolean;
    } = {}
  ): Promise<void> {
    const {
      includeTags = true,
      includeArtist = true,
      includeSource = true,
      sourceName = 'waifu.im',
      includeDescription = true,
      includeRating = true,
      includeCharacters = true,
      includeStats = true,
    } = options;

    // Determine rating emoji
    const ratingInfo = image.rating ? getRatingInfo(image.rating) : { emoji: '⚪', color: 0xffb6c1 };

    // Determine embed color
    let embedColor: number;
    
    // Check if source provides dominant color in API response
    if (sourceProvidesDominantColor(sourceName) && image.dominantColor) {
      // Use the dominant color provided by the API
      const colorDecimal = hexToDecimal(image.dominantColor);
      embedColor = colorDecimal !== undefined ? colorDecimal : ratingInfo.color;
    } else {
      // For sources that don't provide dominant color, extract it from the image
      console.log(`[Discord] Extracting dominant color from image for ${sourceName}...`);
      const extractedColor = await extractDominantColor(image.url);
      const colorDecimal = extractedColor ? hexToDecimal(extractedColor) : undefined;
      embedColor = colorDecimal !== undefined ? colorDecimal : ratingInfo.color;
    }

    // Build dynamic title
    const sourceEmoji = getSourceEmoji(sourceName);
    let title = `${sourceEmoji} ${sourceName}`;
    
    // Add content type indicator
    if (image.isVideo) {
      title += ' | 🎥 Video';
    } else if (image.isAnimated) {
      title += ' | 🎬 GIF';
    }
    
    // Add rating indicator
    if (image.rating && includeRating) {
      title += ` | ${ratingInfo.emoji} ${image.rating.charAt(0).toUpperCase() + image.rating.slice(1)}`;
    }

    const embed: DiscordEmbed = {
      title,
      color: embedColor,
      timestamp: image.createdAt || new Date().toISOString(),
    };

    // Add video or image based on content type
    if (image.isVideo) {
      embed.video = {
        url: image.url,
      };
      // For videos, also set thumbnail as fallback
      embed.image = {
        url: image.url,
      };
    } else {
      embed.image = {
        url: image.url,
      };
    }

    // Add description if available
    if (includeDescription && image.description) {
      embed.description = image.description;
    }

    // Build footer text with enhanced information
    const footerParts: string[] = [];
    
    if (includeStats) {
      // Add file size if available
      if (image.fileSize) {
        footerParts.push(`📁 ${formatFileSize(image.fileSize)}`);
      }

      // Add file extension for Danbooru
      if (image.fileExt) {
        footerParts.push(`📝 ${image.fileExt.toUpperCase()}`);
      }

      // Add favorites if available
      if (image.favorites !== undefined && image.favorites > 0) {
        footerParts.push(`💖 ${formatNumber(image.favorites)}`);
      }

      // Add resolution if available
      if (image.width && image.height) {
        footerParts.push(`📐 ${image.width}x${image.height}`);
      }
      
      // Add hash if available (truncated)
      if (image.contentHash) {
        const shortHash = image.contentHash.substring(0, 8);
        footerParts.push(`🔒 ${shortHash}...`);
      }
    }
    
    // Add ID at the end
    footerParts.push(`ID: ${image.id}`);
    
    embed.footer = {
      text: footerParts.join(' | '),
    };

    // Add author information
    if (includeArtist && image.artists && image.artists.length > 0) {
      const artist = image.artists[0];
      embed.author = {
        name: `🎨 ${artist.name}`,
      };

      if (artist.url) {
        embed.author.url = artist.url;
      }
    }

    // Initialize fields array
    embed.fields = [];

    // Add anime name for nekos.best GIFs
    if (image.animeName) {
      embed.fields.push({
        name: '🎬 Anime',
        value: image.animeName,
        inline: true,
      });
    }

    // Add characters if available
    if (includeCharacters && image.characters && image.characters.length > 0) {
      const characterList = image.characters.slice(0, 3).join(', ');
      embed.fields.push({
        name: '👤 Characters',
        value: characterList + (image.characters.length > 3 ? ` (+${image.characters.length - 3} more)` : ''),
        inline: true,
      });
    }

    // Add copyright/series info for Danbooru
    if (image.copyright && image.copyright.length > 0) {
      const copyrightList = image.copyright.slice(0, 3).join(', ');
      embed.fields.push({
        name: '📺 Series',
        value: copyrightList + (image.copyright.length > 3 ? ` (+${image.copyright.length - 3} more)` : ''),
        inline: true,
      });
    }

    // Add score info for Danbooru (upvotes/downvotes)
    if (image.score !== undefined) {
      const upvotes = image.upvotes || 0;
      const downvotes = image.downvotes || 0;
      embed.fields.push({
        name: '📊 Score',
        value: `**${image.score}** ⬆️ ${upvotes} ⬇️ ${downvotes}`,
        inline: true,
      });
    }

    // Add source link
    if (includeSource && image.source) {
      embed.fields.push({
        name: '📎 Source',
        value: `[Click here](${image.source})`,
        inline: true,
      });
    }

    // Add source post link (for sources that provide post URLs like Danbooru, TBIB, Rule34)
    if (image.postUrl) {
      const sourceEmoji = getSourceEmoji(sourceName);
      const displaySourceName = sourceName === 'rule34' ? 'Rule 34' : sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
      embed.fields.push({
        name: `${sourceEmoji} ${displaySourceName}`,
        value: `[View Post](${image.postUrl})`,
        inline: true,
      });
    }

    // Add tags (respecting Discord's 1024 character limit per field)
    if (includeTags && image.tags && image.tags.length > 0) {
      const maxFieldLength = 1024;
      const tagNames = image.tags.map(tag => `\`${tag.name}\``);

      let tagValue = '';
      let includedCount = 0;

      for (const tag of tagNames) {
        // Check if adding this tag would exceed the limit (including space separator and potential "+X more" text)
        const additionalText = includedCount > 0 ? ' ' : '';
        const remainingText = image.tags.length > includedCount + 1 ? ` (+${image.tags.length - includedCount - 1} more)` : '';

        if (tagValue.length + additionalText.length + tag.length + remainingText.length <= maxFieldLength) {
          tagValue += (includedCount > 0 ? ' ' : '') + tag;
          includedCount++;
        } else {
          break;
        }
      }

      // Add "+X more" if not all tags fit
      if (includedCount < image.tags.length) {
        tagValue += ` (+${image.tags.length - includedCount} more)`;
      }

      embed.fields.push({
        name: '🏷️ Tags',
        value: tagValue || 'No tags',
        inline: false,
      });
    }

    // Add NSFW warning with enhanced content
    if (image.isNsfw) {
      let warningValue = '⚠️ NSFW Content';
      if (image.rating) {
        warningValue = `${ratingInfo.emoji} ${image.rating.toUpperCase()} Content`;
      }
      embed.fields.push({
        name: '🔞 Content Warning',
        value: warningValue,
        inline: true,
      });
    }

    // Determine avatar URL and display name based on source
    let avatarUrl: string | undefined;
    let displayName: string = sourceName;

    if (sourceName === 'Nekos API') {
      avatarUrl = 'https://nekosapi.com/branding/logo/logo.png';
    } else if (sourceName === 'nekos.best') {
      avatarUrl = 'https://nekos.best/favicon.png';
    } else if (sourceName === 'waifu.pics') {
      avatarUrl = 'https://waifu.pics/favicon.png';
    } else if (sourceName === 'pic.re') {
      // Pic.re has no official icon/logo - leave avatar empty as requested
      avatarUrl = undefined;
    } else if (sourceName === 'danbooru') {
      avatarUrl = 'https://danbooru.donmai.us/packs/static/danbooru-logo-128x128-ea111b6658173e847734.png';
      displayName = 'Danbooru';
    } else if (sourceName === 'rule34') {
      avatarUrl = 'https://ssd-cdn.nest.rip/uploads/fb0860f1-6358-4460-866b-e854d08ffda4.jpg';
      displayName = 'Rule 34';
    } else if (sourceName === 'tbib') {
      // TBIB has no official icon/logo - leave avatar empty as requested
      avatarUrl = undefined;
      displayName = 'TBIB';
    } else {
      avatarUrl = 'https://www.waifu.im/favicon.png';
    }

    const payload: DiscordWebhookPayload = {
      username: displayName,
      avatar_url: avatarUrl,
      embeds: [embed],
    };

    await this.sendPayload(payload);
  }

  /**
   * Send raw image URL (fallback method)
   */
  async sendImageUrl(imageUrl: string, caption?: string): Promise<void> {
    const payload: DiscordWebhookPayload = {
      content: caption ? `${caption}\n${imageUrl}` : imageUrl,
    };
    await this.sendPayload(payload);
  }

  /**
   * Send payload to Discord webhook
   */
  private async sendPayload(payload: DiscordWebhookPayload): Promise<void> {
    try {
      await this.client.post(this.webhookUrl, payload);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // Discord returns 204 No Content on success
        if (axiosError.response.status === 204) {
          return;
        }
        const responseData = axiosError.response.data as { message?: string } | undefined;
        throw new Error(
          `Discord webhook error: ${axiosError.response.status} - ${
            responseData ? JSON.stringify(responseData) : axiosError.message
          }`
        );
      }
      throw new Error(`Failed to send webhook: ${axiosError.message}`);
    }
  }

}
