export const ThemeAppearanceMode = {
  Light: 'light',
  Dark: 'dark',
  System: 'system',
} as const;

export type ThemeAppearanceMode =
  typeof ThemeAppearanceMode[keyof typeof ThemeAppearanceMode];

export const SkinPaletteMode = {
  Theme: 'theme',
  Image: 'image',
} as const;

export type SkinPaletteMode =
  typeof SkinPaletteMode[keyof typeof SkinPaletteMode];

export const SkinBackgroundFit = {
  Cover: 'cover',
  Contain: 'contain',
} as const;

export type SkinBackgroundFit =
  typeof SkinBackgroundFit[keyof typeof SkinBackgroundFit];

export const SkinSafeArea = {
  Auto: 'auto',
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const;

export type SkinSafeArea =
  typeof SkinSafeArea[keyof typeof SkinSafeArea];

export const SkinSurfaceMode = {
  Home: 'home',
  Task: 'task',
  Utility: 'utility',
} as const;

export type SkinSurfaceMode =
  typeof SkinSurfaceMode[keyof typeof SkinSurfaceMode];

export const SkinAssetKind = {
  Builtin: 'builtin',
  User: 'user',
} as const;

export type SkinAssetKind =
  typeof SkinAssetKind[keyof typeof SkinAssetKind];

export const ThemeSkinIpcChannel = {
  ImportAsset: 'theme-skin:import-asset',
  ResolveAsset: 'theme-skin:resolve-asset',
  PruneAssets: 'theme-skin:prune-assets',
} as const;

export type ThemeSkinIpcChannel =
  typeof ThemeSkinIpcChannel[keyof typeof ThemeSkinIpcChannel];

export const ThemeSkinAssetErrorCode = {
  MissingPath: 'missing_path',
  NotFile: 'not_file',
  UnsupportedType: 'unsupported_type',
  FileTooLarge: 'file_too_large',
  InvalidImage: 'invalid_image',
  ImageTooLarge: 'image_too_large',
  InvalidAssetId: 'invalid_asset_id',
  AssetNotFound: 'asset_not_found',
  ImportFailed: 'import_failed',
  ResolveFailed: 'resolve_failed',
  PruneFailed: 'prune_failed',
} as const;

export type ThemeSkinAssetErrorCode =
  typeof ThemeSkinAssetErrorCode[keyof typeof ThemeSkinAssetErrorCode];

export interface ThemeSkinPoint {
  x: number;
  y: number;
}

export interface ThemeSkinPalette {
  primary: string;
  accent: string;
  averageLuminance: number;
}

export interface ThemeSkinAssetAnalysis {
  palette: ThemeSkinPalette;
  focalPoint: ThemeSkinPoint;
}

export interface ThemeSkinAssetRef {
  kind: SkinAssetKind;
  id: string;
}

export interface ThemeSkinAssetDescriptor {
  assetId: string;
  url: string;
  width: number;
  height: number;
  sizeBytes: number;
  analysis: ThemeSkinAssetAnalysis;
}

export interface ThemeSkinBackground {
  asset: ThemeSkinAssetRef;
  fit: SkinBackgroundFit;
  safeArea: SkinSafeArea;
  focalPoint: ThemeSkinPoint;
  intensity: number;
}

export interface ThemeSkinReadability {
  autoContrast: boolean;
  reduceTaskInterference: boolean;
  taskIntensity: number;
}

export interface ThemeSkinComposition {
  appearanceMode: ThemeAppearanceMode;
  themeIds: {
    light: string;
    dark: string;
  };
  paletteMode: SkinPaletteMode;
  background: ThemeSkinBackground | null;
  readability: ThemeSkinReadability;
}

export interface ThemeSkinPreset {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  composition: ThemeSkinComposition;
}

export interface ThemeSkinState {
  schemaVersion: 1;
  activeSkinId: string | null;
  active: ThemeSkinComposition;
  savedSkins: ThemeSkinPreset[];
}

export interface ThemeSkinAssetResult {
  success: boolean;
  asset?: ThemeSkinAssetDescriptor;
  errorCode?: ThemeSkinAssetErrorCode;
  error?: string;
}

export interface ThemeSkinPruneResult {
  success: boolean;
  removed?: number;
  errorCode?: ThemeSkinAssetErrorCode;
  error?: string;
}

export const DEFAULT_THEME_SKIN_COMPOSITION: ThemeSkinComposition = {
  appearanceMode: ThemeAppearanceMode.System,
  themeIds: {
    light: 'classic-light',
    dark: 'classic-dark',
  },
  paletteMode: SkinPaletteMode.Theme,
  background: null,
  readability: {
    autoContrast: true,
    reduceTaskInterference: true,
    taskIntensity: 35,
  },
};

export const createDefaultThemeSkinState = (): ThemeSkinState => ({
  schemaVersion: 1,
  activeSkinId: null,
  active: {
    ...DEFAULT_THEME_SKIN_COMPOSITION,
    themeIds: { ...DEFAULT_THEME_SKIN_COMPOSITION.themeIds },
    readability: { ...DEFAULT_THEME_SKIN_COMPOSITION.readability },
  },
  savedSkins: [],
});
