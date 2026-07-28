import {
  createDefaultThemeSkinState,
  SkinAssetKind,
  SkinBackgroundFit,
  SkinPaletteMode,
  SkinSafeArea,
  ThemeAppearanceMode,
  type ThemeAppearanceMode as ThemeAppearanceModeType,
  type ThemeSkinAssetRef,
  type ThemeSkinBackground,
  type ThemeSkinComposition,
  type ThemeSkinPoint,
  type ThemeSkinPreset,
  type ThemeSkinState,
} from '@shared/theme/constants';

import { allThemes } from '../themes';

const themeById = new Map(allThemes.map((theme) => [theme.meta.id, theme]));

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const clampPercent = (value: unknown, fallback: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : fallback;
};

const normalizeAppearanceMode = (
  value: unknown,
  fallback: ThemeAppearanceModeType,
): ThemeAppearanceModeType => {
  if (value === ThemeAppearanceMode.Light
    || value === ThemeAppearanceMode.Dark
    || value === ThemeAppearanceMode.System) {
    return value;
  }
  return fallback;
};

const normalizeThemeId = (
  value: unknown,
  appearance: 'light' | 'dark',
  fallback: string,
): string => {
  if (typeof value !== 'string') return fallback;
  const theme = themeById.get(value);
  return theme?.meta.appearance === appearance ? value : fallback;
};

const normalizePoint = (value: unknown, fallback: ThemeSkinPoint): ThemeSkinPoint => {
  if (!isRecord(value)) return { ...fallback };
  return {
    x: clampPercent(value.x, fallback.x),
    y: clampPercent(value.y, fallback.y),
  };
};

const normalizeAsset = (value: unknown): ThemeSkinAssetRef | null => {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()) return null;
  if (value.kind !== SkinAssetKind.Builtin && value.kind !== SkinAssetKind.User) return null;
  return {
    kind: value.kind,
    id: value.id.trim(),
  };
};

const normalizeBackground = (value: unknown): ThemeSkinBackground | null => {
  if (!isRecord(value)) return null;
  const asset = normalizeAsset(value.asset);
  if (!asset) return null;
  const safeArea = value.safeArea === SkinSafeArea.Left
    || value.safeArea === SkinSafeArea.Center
    || value.safeArea === SkinSafeArea.Right
    ? value.safeArea
    : SkinSafeArea.Auto;
  const fallbackPoint = safeArea === SkinSafeArea.Left
    ? { x: 25, y: 50 }
    : safeArea === SkinSafeArea.Right
      ? { x: 75, y: 50 }
      : { x: 50, y: 50 };

  return {
    asset,
    fit: value.fit === SkinBackgroundFit.Contain
      ? SkinBackgroundFit.Contain
      : SkinBackgroundFit.Cover,
    safeArea,
    focalPoint: normalizePoint(value.focalPoint, fallbackPoint),
    intensity: clampPercent(value.intensity, 45),
  };
};

export const cloneThemeSkinComposition = (
  composition: ThemeSkinComposition,
): ThemeSkinComposition => ({
  ...composition,
  themeIds: { ...composition.themeIds },
  background: composition.background
    ? {
        ...composition.background,
        asset: { ...composition.background.asset },
        focalPoint: { ...composition.background.focalPoint },
      }
    : null,
  readability: { ...composition.readability },
});

const normalizeComposition = (
  value: unknown,
  fallback: ThemeSkinComposition,
): ThemeSkinComposition => {
  const source = isRecord(value) ? value : {};
  const rawThemeIds = isRecord(source.themeIds) ? source.themeIds : {};
  const rawReadability = isRecord(source.readability) ? source.readability : {};
  return {
    appearanceMode: normalizeAppearanceMode(
      source.appearanceMode,
      fallback.appearanceMode,
    ),
    themeIds: {
      light: normalizeThemeId(rawThemeIds.light, ThemeAppearanceMode.Light, fallback.themeIds.light),
      dark: normalizeThemeId(rawThemeIds.dark, ThemeAppearanceMode.Dark, fallback.themeIds.dark),
    },
    paletteMode: source.paletteMode === SkinPaletteMode.Image
      ? SkinPaletteMode.Image
      : SkinPaletteMode.Theme,
    background: normalizeBackground(source.background),
    readability: {
      autoContrast: typeof rawReadability.autoContrast === 'boolean'
        ? rawReadability.autoContrast
        : fallback.readability.autoContrast,
      reduceTaskInterference: typeof rawReadability.reduceTaskInterference === 'boolean'
        ? rawReadability.reduceTaskInterference
        : fallback.readability.reduceTaskInterference,
      taskIntensity: clampPercent(
        rawReadability.taskIntensity,
        fallback.readability.taskIntensity,
      ),
    },
  };
};

const normalizePreset = (
  value: unknown,
  fallback: ThemeSkinComposition,
): ThemeSkinPreset | null => {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }
  const id = value.id.trim();
  const name = value.name.trim();
  if (!id || !name) return null;
  const createdAt = typeof value.createdAt === 'number' && Number.isFinite(value.createdAt)
    ? value.createdAt
    : Date.now();
  const updatedAt = typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
    ? value.updatedAt
    : createdAt;
  return {
    id,
    name,
    createdAt,
    updatedAt,
    composition: normalizeComposition(value.composition, fallback),
  };
};

export const normalizeThemeSkinState = (
  value: unknown,
  legacyMode: unknown,
  legacyThemeId?: string | null,
): ThemeSkinState => {
  const defaults = createDefaultThemeSkinState();
  const fallbackMode = normalizeAppearanceMode(legacyMode, defaults.active.appearanceMode);
  const legacyTheme = legacyThemeId ? themeById.get(legacyThemeId) : undefined;
  if (legacyTheme?.meta.appearance === ThemeAppearanceMode.Light) {
    defaults.active.themeIds.light = legacyTheme.meta.id;
  }
  if (legacyTheme?.meta.appearance === ThemeAppearanceMode.Dark) {
    defaults.active.themeIds.dark = legacyTheme.meta.id;
  }
  defaults.active.appearanceMode = fallbackMode;

  if (!isRecord(value)) return defaults;

  const active = normalizeComposition(value.active, defaults.active);
  const savedSkins = Array.isArray(value.savedSkins)
    ? value.savedSkins
        .map((preset) => normalizePreset(preset, active))
        .filter((preset): preset is ThemeSkinPreset => preset !== null)
    : [];
  const activeSkinId = typeof value.activeSkinId === 'string'
    && value.activeSkinId.trim()
    ? value.activeSkinId.trim()
    : null;

  return {
    schemaVersion: 1,
    activeSkinId,
    active,
    savedSkins,
  };
};

export const collectThemeSkinUserAssetIds = (state: ThemeSkinState): string[] => {
  const ids = new Set<string>();
  const collect = (composition: ThemeSkinComposition): void => {
    const asset = composition.background?.asset;
    if (asset?.kind === SkinAssetKind.User) ids.add(asset.id);
  };
  collect(state.active);
  state.savedSkins.forEach((preset) => collect(preset.composition));
  return [...ids];
};

export const getEffectiveThemeId = (
  composition: ThemeSkinComposition,
  prefersDark: boolean,
): string => {
  if (composition.appearanceMode === ThemeAppearanceMode.Light) {
    return composition.themeIds.light;
  }
  if (composition.appearanceMode === ThemeAppearanceMode.Dark) {
    return composition.themeIds.dark;
  }
  return prefersDark ? composition.themeIds.dark : composition.themeIds.light;
};
