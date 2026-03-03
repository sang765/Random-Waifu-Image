/**
 * Discord Webhook client for sending images to Discord channels
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SourceImage, ContentRating, hexToDecimal } from '../types/source';

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
    default:
      return '🎴';
  }
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  image?: {
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

    // Determine rating emoji (color always comes from image)
    const ratingInfo = image.rating ? getRatingInfo(image.rating) : { emoji: '⚪', color: 0xffb6c1 };

    // Always use dominant color from image for embed color
    const embedColor = hexToDecimal(image.dominantColor) || ratingInfo.color;

    // Build dynamic title
    const sourceEmoji = getSourceEmoji(sourceName);
    let title = `${sourceEmoji} ${sourceName}`;
    
    // Add content type indicator
    if (image.isAnimated) {
      title += ' | 🎬 GIF';
    }
    
    // Add rating indicator
    if (image.rating && includeRating) {
      title += ` | ${ratingInfo.emoji} ${image.rating.charAt(0).toUpperCase() + image.rating.slice(1)}`;
    }

    const embed: DiscordEmbed = {
      title,
      color: embedColor,
      image: {
        url: image.url,
      },
      timestamp: image.createdAt || new Date().toISOString(),
    };

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

    // Add source link
    if (includeSource && image.source) {
      embed.fields.push({
        name: '📎 Source',
        value: `[Click here](${image.source})`,
        inline: true,
      });
    }

    // Add tags
    if (includeTags && image.tags && image.tags.length > 0) {
      const tagNames = image.tags.map(tag => `\`${tag.name}\``).slice(0, 8);
      embed.fields.push({
        name: '🏷️ Tags',
        value: tagNames.join(' ') || 'No tags',
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

    // Determine avatar URL based on source
    let avatarUrl: string | undefined;
    if (sourceName === 'Nekos API') {
      avatarUrl = 'https://nekosapi.com/branding/logo/logo.png';
    } else if (sourceName === 'nekos.best') {
      avatarUrl = 'https://nekos.best/favicon.png';
    } else if (sourceName === 'waifu.pics') {
      avatarUrl = 'https://waifu.pics/favicon.png';
    } else if (sourceName === 'pic.re') {
      // Pic.re has no official icon/logo - leave avatar empty as requested
      avatarUrl = undefined;
    } else {
      avatarUrl = 'https://www.waifu.im/favicon.png';
    }

    const payload: DiscordWebhookPayload = {
      username: sourceName,
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
