import { expect, test } from 'vitest';

import { ThemeAppearanceMode } from './constants';
import {
  analyzeBgraBitmap,
  getContrastProtectionOpacity,
  getContrastRatio,
} from './imageAnalysis';

test('analyzeBgraBitmap extracts a dominant palette from a solid bitmap', () => {
  const bitmap = new Uint8Array([
    20, 80, 220, 255,
    20, 80, 220, 255,
    20, 80, 220, 255,
    20, 80, 220, 255,
  ]);

  const result = analyzeBgraBitmap(bitmap, 2, 2);

  expect(result.palette.primary).toBe('#dc5014');
  expect(result.palette.averageLuminance).toBeGreaterThan(0.1);
  expect(result.focalPoint.x).toBeCloseTo(50);
  expect(result.focalPoint.y).toBeCloseTo(50);
});

test('analyzeBgraBitmap falls back for invalid pixel data', () => {
  const result = analyzeBgraBitmap(new Uint8Array(), 0, 0);

  expect(result.palette.primary).toBe('#4f7cc9');
  expect(result.focalPoint).toEqual({ x: 50, y: 50 });
});

test('getContrastRatio reports WCAG contrast for black and white', () => {
  expect(getContrastRatio('#000000', '#ffffff')).toBe(21);
  expect(getContrastRatio('#777777', '#777777')).toBe(1);
});

test('getContrastProtectionOpacity responds to image luminance and appearance', () => {
  expect(getContrastProtectionOpacity(0.9, ThemeAppearanceMode.Dark, true))
    .toBeGreaterThan(getContrastProtectionOpacity(0.1, ThemeAppearanceMode.Dark, true));
  expect(getContrastProtectionOpacity(0.1, ThemeAppearanceMode.Light, true))
    .toBeGreaterThan(getContrastProtectionOpacity(0.9, ThemeAppearanceMode.Light, true));
  expect(getContrastProtectionOpacity(0.5, ThemeAppearanceMode.Light, false)).toBe(0.04);
});
