/**
 * Utility for extracting dominant colors from images
 * Uses node-vibrant to analyze images and get their palette
 */

import { Vibrant } from 'node-vibrant/node';

/**
 * Extract the dominant color from an image URL
 * @param imageUrl - URL of the image to analyze
 * @returns Hex color string (e.g., "#ff5733") or undefined if extraction fails
 */
export async function extractDominantColor(imageUrl: string): Promise<string | undefined> {
  try {
    const palette = await Vibrant.from(imageUrl).getPalette();
    
    // Get the dominant color (Vibrant swatch is usually the most prominent)
    const dominantSwatch = palette.Vibrant || palette.DarkVibrant || palette.LightVibrant || 
                          palette.Muted || palette.DarkMuted || palette.LightMuted;
    
    if (dominantSwatch) {
      // Convert RGB to hex (rgb is a Vec3 array [r, g, b])
      const [r, g, b] = dominantSwatch.rgb;
      return rgbToHex(r, g, b);
    }
    
    return undefined;
  } catch (error) {
    console.warn(`Failed to extract color from ${imageUrl}:`, error instanceof Error ? error.message : String(error));
    return undefined;
  }
}

/**
 * Convert RGB values to hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert hex color to decimal for Discord embeds
 */
export function hexToDecimal(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
