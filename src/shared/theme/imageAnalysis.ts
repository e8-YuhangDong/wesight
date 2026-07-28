import type {
  ThemeSkinAssetAnalysis,
  ThemeSkinPoint,
} from './constants';
import { ThemeAppearanceMode } from './constants';

interface QuantizedColor {
  count: number;
  red: number;
  green: number;
  blue: number;
  saturation: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const toHex = (value: number): string =>
  Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0');

const rgbToHex = (red: number, green: number, blue: number): string =>
  `#${toHex(red)}${toHex(green)}${toHex(blue)}`;

const getLuminance = (red: number, green: number, blue: number): number => {
  const normalize = (channel: number): number => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : ((value + 0.055) / 1.055) ** 2.4;
  };
  return (
    normalize(red) * 0.2126
    + normalize(green) * 0.7152
    + normalize(blue) * 0.0722
  );
};

const getSaturation = (red: number, green: number, blue: number): number => {
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  return max === 0 ? 0 : (max - min) / max;
};

const quantizeChannel = (channel: number): number =>
  Math.min(255, Math.round(channel / 32) * 32);

const FALLBACK_ANALYSIS: ThemeSkinAssetAnalysis = {
  palette: {
    primary: '#4f7cc9',
    accent: '#69b7a9',
    averageLuminance: 0.5,
  },
  focalPoint: {
    x: 50,
    y: 50,
  },
};

/**
 * Analyze a BGRA bitmap produced by Electron nativeImage.toBitmap().
 * Percent-based focal coordinates can be used directly by CSS object-position.
 */
export const analyzeBgraBitmap = (
  bitmap: Uint8Array,
  width: number,
  height: number,
): ThemeSkinAssetAnalysis => {
  if (width <= 0 || height <= 0 || bitmap.length < width * height * 4) {
    return FALLBACK_ANALYSIS;
  }

  const colors = new Map<string, QuantizedColor>();
  let luminanceTotal = 0;
  let sampleCount = 0;
  const samples: Array<{
    x: number;
    y: number;
    luminance: number;
    saturation: number;
  }> = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const blue = bitmap[offset] ?? 0;
      const green = bitmap[offset + 1] ?? 0;
      const red = bitmap[offset + 2] ?? 0;
      const alpha = bitmap[offset + 3] ?? 255;
      if (alpha < 32) continue;

      const luminance = getLuminance(red, green, blue);
      const saturation = getSaturation(red, green, blue);
      luminanceTotal += luminance;
      sampleCount += 1;
      samples.push({ x, y, luminance, saturation });

      const quantizedRed = quantizeChannel(red);
      const quantizedGreen = quantizeChannel(green);
      const quantizedBlue = quantizeChannel(blue);
      const key = `${quantizedRed},${quantizedGreen},${quantizedBlue}`;
      const current = colors.get(key);
      if (current) {
        current.count += 1;
        current.red += red;
        current.green += green;
        current.blue += blue;
        current.saturation += saturation;
      } else {
        colors.set(key, {
          count: 1,
          red,
          green,
          blue,
          saturation,
        });
      }
    }
  }

  if (sampleCount === 0 || colors.size === 0) {
    return FALLBACK_ANALYSIS;
  }

  const averageLuminance = luminanceTotal / sampleCount;
  const rankedColors = [...colors.values()].sort((left, right) => right.count - left.count);
  const primaryCandidate = rankedColors[0];
  const accentCandidate = rankedColors
    .slice(0, Math.min(rankedColors.length, 24))
    .sort((left, right) => {
      const leftScore = (left.saturation / left.count) * Math.sqrt(left.count);
      const rightScore = (right.saturation / right.count) * Math.sqrt(right.count);
      return rightScore - leftScore;
    })[0] ?? primaryCandidate;

  const averageColor = (candidate: QuantizedColor): [number, number, number] => [
    candidate.red / candidate.count,
    candidate.green / candidate.count,
    candidate.blue / candidate.count,
  ];

  let saliencyTotal = 0;
  let weightedX = 0;
  let weightedY = 0;
  for (const sample of samples) {
    const saliency = 0.05
      + Math.abs(sample.luminance - averageLuminance) * 0.65
      + sample.saturation * 0.35;
    saliencyTotal += saliency;
    weightedX += sample.x * saliency;
    weightedY += sample.y * saliency;
  }

  const focalPoint: ThemeSkinPoint = saliencyTotal > 0
    ? {
        x: clamp((weightedX / saliencyTotal / Math.max(1, width - 1)) * 100, 0, 100),
        y: clamp((weightedY / saliencyTotal / Math.max(1, height - 1)) * 100, 0, 100),
      }
    : FALLBACK_ANALYSIS.focalPoint;

  const [primaryRed, primaryGreen, primaryBlue] = averageColor(primaryCandidate);
  const [accentRed, accentGreen, accentBlue] = averageColor(accentCandidate);

  return {
    palette: {
      primary: rgbToHex(primaryRed, primaryGreen, primaryBlue),
      accent: rgbToHex(accentRed, accentGreen, accentBlue),
      averageLuminance,
    },
    focalPoint,
  };
};

export const getContrastRatio = (foreground: string, background: string): number => {
  const parse = (color: string): [number, number, number] | null => {
    const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return match
      ? [
          Number.parseInt(match[1], 16),
          Number.parseInt(match[2], 16),
          Number.parseInt(match[3], 16),
        ]
      : null;
  };
  const foregroundRgb = parse(foreground);
  const backgroundRgb = parse(background);
  if (!foregroundRgb || !backgroundRgb) return 1;
  const foregroundLuminance = getLuminance(...foregroundRgb);
  const backgroundLuminance = getLuminance(...backgroundRgb);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

export const getContrastProtectionOpacity = (
  averageLuminance: number,
  appearance: typeof ThemeAppearanceMode.Light | typeof ThemeAppearanceMode.Dark,
  enabled: boolean,
): number => {
  if (!enabled) return 0.04;
  const luminance = clamp(averageLuminance, 0, 1);
  return appearance === ThemeAppearanceMode.Dark
    ? 0.12 + luminance * 0.22
    : 0.08 + (1 - luminance) * 0.22;
};
