import {
  SkinAssetKind,
  SkinBackgroundFit,
  SkinPaletteMode,
  SkinSafeArea,
  ThemeAppearanceMode,
} from '@shared/theme/constants';
import { expect, test } from 'vitest';

import {
  collectThemeSkinUserAssetIds,
  normalizeThemeSkinState,
} from './config';

test('normalizeThemeSkinState migrates legacy appearance and theme id', () => {
  const state = normalizeThemeSkinState(
    undefined,
    ThemeAppearanceMode.Dark,
    'nord',
  );

  expect(state.schemaVersion).toBe(1);
  expect(state.active.appearanceMode).toBe(ThemeAppearanceMode.Dark);
  expect(state.active.themeIds.dark).toBe('nord');
  expect(state.active.themeIds.light).toBe('classic-light');
});

test('normalizeThemeSkinState clamps intensities and rejects invalid theme ids', () => {
  const state = normalizeThemeSkinState({
    active: {
      appearanceMode: ThemeAppearanceMode.Light,
      themeIds: {
        light: 'missing-theme',
        dark: 'classic-dark',
      },
      paletteMode: SkinPaletteMode.Image,
      background: {
        asset: {
          kind: SkinAssetKind.User,
          id: `${'a'.repeat(64)}.webp`,
        },
        fit: SkinBackgroundFit.Contain,
        safeArea: SkinSafeArea.Right,
        focalPoint: { x: 130, y: -10 },
        intensity: 180,
      },
      readability: {
        autoContrast: true,
        reduceTaskInterference: true,
        taskIntensity: -20,
      },
    },
    savedSkins: [],
  }, ThemeAppearanceMode.System, null);

  expect(state.active.themeIds.light).toBe('classic-light');
  expect(state.active.background?.focalPoint).toEqual({ x: 100, y: 0 });
  expect(state.active.background?.intensity).toBe(100);
  expect(state.active.readability.taskIntensity).toBe(0);
});

test('collectThemeSkinUserAssetIds returns unique active and saved assets', () => {
  const assetId = `${'b'.repeat(64)}.jpg`;
  const state = normalizeThemeSkinState({
    active: {
      background: {
        asset: { kind: SkinAssetKind.User, id: assetId },
      },
    },
    savedSkins: [{
      id: 'custom-one',
      name: 'Custom one',
      createdAt: 1,
      updatedAt: 1,
      composition: {
        background: {
          asset: { kind: SkinAssetKind.User, id: assetId },
        },
      },
    }],
  }, ThemeAppearanceMode.System, null);

  expect(collectThemeSkinUserAssetIds(state)).toEqual([assetId]);
});
