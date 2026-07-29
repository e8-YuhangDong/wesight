import {
  SkinAssetKind,
  SkinBackgroundFit,
  SkinPaletteMode,
  SkinSafeArea,
  ThemeAppearanceMode,
  type ThemeSkinAssetDescriptor,
  type ThemeSkinComposition,
} from '@shared/theme/constants';

import { resolvePublicAssetUrl } from '../../services/publicAssets';

export interface BuiltinThemeSkin {
  id: string;
  nameKey: string;
  descriptionKey: string;
  asset: ThemeSkinAssetDescriptor;
  composition: ThemeSkinComposition;
}

export const BuiltinThemeSkinId = {
  CloudridgeDawn: 'builtin-cloudridge-dawn',
  MidnightHorizon: 'builtin-midnight-horizon',
  QuietPaperGarden: 'builtin-quiet-paper-garden',
} as const;

const createBuiltinAsset = (
  assetId: string,
  url: string,
  primary: string,
  accent: string,
  averageLuminance: number,
  focalPoint: { x: number; y: number },
): ThemeSkinAssetDescriptor => ({
  assetId,
  url,
  width: 1586,
  height: 992,
  sizeBytes: 0,
  analysis: {
    palette: {
      primary,
      accent,
      averageLuminance,
    },
    focalPoint,
  },
});

const createComposition = (
  assetId: string,
  appearanceMode: 'light' | 'dark',
  lightThemeId: string,
  darkThemeId: string,
  focalPoint: { x: number; y: number },
): ThemeSkinComposition => ({
  appearanceMode,
  themeIds: {
    light: lightThemeId,
    dark: darkThemeId,
  },
  paletteMode: SkinPaletteMode.Image,
  background: {
    asset: {
      kind: SkinAssetKind.Builtin,
      id: assetId,
    },
    fit: SkinBackgroundFit.Cover,
    safeArea: SkinSafeArea.Auto,
    focalPoint,
    intensity: 45,
  },
  readability: {
    autoContrast: true,
    reduceTaskInterference: true,
    taskIntensity: 35,
  },
});

const cloudridgeAsset = createBuiltinAsset(
  BuiltinThemeSkinId.CloudridgeDawn,
  resolvePublicAssetUrl('theme-skins/cloudridge-dawn.webp'),
  '#b77949',
  '#d6a46a',
  0.67,
  { x: 61, y: 55 },
);

const midnightAsset = createBuiltinAsset(
  BuiltinThemeSkinId.MidnightHorizon,
  resolvePublicAssetUrl('theme-skins/midnight-horizon.webp'),
  '#315f9f',
  '#3da6b8',
  0.12,
  { x: 69, y: 55 },
);

const paperAsset = createBuiltinAsset(
  BuiltinThemeSkinId.QuietPaperGarden,
  resolvePublicAssetUrl('theme-skins/quiet-paper-garden.webp'),
  '#8b9b83',
  '#b68b5a',
  0.88,
  { x: 75, y: 52 },
);

export const BUILTIN_THEME_SKINS: BuiltinThemeSkin[] = [
  {
    id: BuiltinThemeSkinId.CloudridgeDawn,
    nameKey: 'themeSkinBuiltinCloudridgeDawn',
    descriptionKey: 'themeSkinBuiltinCloudridgeDawnDescription',
    asset: cloudridgeAsset,
    composition: createComposition(
      cloudridgeAsset.assetId,
      ThemeAppearanceMode.Light,
      'dawn',
      'midnight',
      cloudridgeAsset.analysis.focalPoint,
    ),
  },
  {
    id: BuiltinThemeSkinId.MidnightHorizon,
    nameKey: 'themeSkinBuiltinMidnightHorizon',
    descriptionKey: 'themeSkinBuiltinMidnightHorizonDescription',
    asset: midnightAsset,
    composition: createComposition(
      midnightAsset.assetId,
      ThemeAppearanceMode.Dark,
      'dawn',
      'midnight',
      midnightAsset.analysis.focalPoint,
    ),
  },
  {
    id: BuiltinThemeSkinId.QuietPaperGarden,
    nameKey: 'themeSkinBuiltinQuietPaperGarden',
    descriptionKey: 'themeSkinBuiltinQuietPaperGardenDescription',
    asset: paperAsset,
    composition: createComposition(
      paperAsset.assetId,
      ThemeAppearanceMode.Light,
      'paper',
      'mocha',
      paperAsset.analysis.focalPoint,
    ),
  },
];

export const getBuiltinThemeSkin = (id: string | null): BuiltinThemeSkin | undefined =>
  BUILTIN_THEME_SKINS.find((skin) => skin.id === id);

export const getBuiltinThemeSkinAsset = (
  assetId: string,
): ThemeSkinAssetDescriptor | undefined =>
  BUILTIN_THEME_SKINS.find((skin) => skin.asset.assetId === assetId)?.asset;
