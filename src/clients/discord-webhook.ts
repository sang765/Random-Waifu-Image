/**
 * Discord Webhook client for sending images to Discord channels
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { SourceImage, hexToDecimal } from '../types/source';

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
    } = {}
  ): Promise<void> {
    const { includeTags = true, includeArtist = true, includeSource = true, sourceName = 'waifu.im' } = options;

    const embed: DiscordEmbed = {
      title: '🌸 Random Waifu',
      color: hexToDecimal(image.dominantColor) || 0xffb6c1,
      image: {
        url: image.url,
      },
      footer: {
        text: `ID: ${image.id} | Resolution: ${image.width ?? '?'}x${image.height ?? '?'}`,
      },
      timestamp: new Date().toISOString(),
    };

    // Add artist information
    if (includeArtist && image.artists && image.artists.length > 0) {
      const artist = image.artists[0];
      embed.author = {
        name: `Artist: ${artist.name}`,
      };

      if (artist.url) {
        embed.author.url = artist.url;
      }
    }

    // Add fields
    embed.fields = [];

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
      const tagNames = image.tags.map(tag => `\`${tag.name}\``).slice(0, 5);
      embed.fields.push({
        name: '🏷️ Tags',
        value: tagNames.join(' ') || 'No tags',
        inline: true,
      });
    }

    // Add NSFW warning if applicable
    if (image.isNsfw) {
      embed.fields.push({
        name: '⚠️ Warning',
        value: 'NSFW Content',
        inline: true,
      });
    }

    // Determine avatar URL based on source
    let avatarUrl: string | undefined;
    if (sourceName === 'Nekos API') {
      avatarUrl = 'https://nekosapi.com/branding/logo/logo.png';
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
