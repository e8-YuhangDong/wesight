import {
  createDefaultThemeSkinState,
  SkinAssetKind,
  SkinPaletteMode,
  SkinSurfaceMode,
  type SkinSurfaceMode as SkinSurfaceModeType,
  ThemeAppearanceMode,
  type ThemeAppearanceMode as ThemeAppearanceModeType,
  type ThemeSkinAssetDescriptor,
  type ThemeSkinComposition,
  type ThemeSkinState,
} from '@shared/theme/constants';
import { getContrastProtectionOpacity } from '@shared/theme/imageAnalysis';

import type { ThemeDefinition } from '../theme';
import { allThemes, ThemeManager } from '../theme';
import {
  getBuiltinThemeSkinAsset,
} from '../theme/skin/builtins';
import {
  cloneThemeSkinComposition,
  collectThemeSkinUserAssetIds,
  getEffectiveThemeId,
  normalizeThemeSkinState,
} from '../theme/skin/config';
import { configService } from './config';

type ThemeSkinListener = (state: ThemeSkinState) => void;

const cloneThemeSkinState = (state: ThemeSkinState): ThemeSkinState => ({
  ...state,
  active: cloneThemeSkinComposition(state.active),
  savedSkins: state.savedSkins.map((preset) => ({
    ...preset,
    composition: cloneThemeSkinComposition(preset.composition),
  })),
});

const parseHex = (color: string): [number, number, number] | null => {
  const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  return match
    ? [
        Number.parseInt(match[1], 16),
        Number.parseInt(match[2], 16),
        Number.parseInt(match[3], 16),
      ]
    : null;
};

const mixHex = (color: string, target: [number, number, number], amount: number): string => {
  const source = parseHex(color);
  if (!source) return color;
  const mixed = source.map((channel, index) =>
    Math.round(channel + (target[index] - channel) * amount));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
};

const getReadableForeground = (background: string): string => {
  const rgb = parseHex(background);
  if (!rgb) return '#ffffff';
  const [red, green, blue] = rgb.map((channel) => channel / 255);
  const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
  return luminance > 0.56 ? '#172033' : '#ffffff';
};

class ThemeService {
  private mediaQuery: MediaQueryList | null = null;
  private currentTheme: ThemeAppearanceModeType = ThemeAppearanceMode.System;
  private initialized = false;
  private mediaQueryListener: ((event: MediaQueryListEvent) => void) | null = null;
  private manager: ThemeManager;
  private appliedSkinState: ThemeSkinState = createDefaultThemeSkinState();
  private visualSkinState: ThemeSkinState = createDefaultThemeSkinState();
  private activeAsset: ThemeSkinAssetDescriptor | null = null;
  private listeners = new Set<ThemeSkinListener>();
  private applyVersion = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }
    this.manager = new ThemeManager(allThemes, {
      defaultTheme: 'classic-light',
      followSystem: false,
      storage: {
        get: () => null,
        set: () => undefined,
      },
    });
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const config = configService.getConfig();
      const normalized = normalizeThemeSkinState(config.themeSkin, config.theme, null);
      this.appliedSkinState = cloneThemeSkinState(normalized);
      this.visualSkinState = cloneThemeSkinState(normalized);
      this.currentTheme = normalized.active.appearanceMode;
      await this.applyVisualState(normalized);

      if (this.mediaQuery) {
        this.mediaQueryListener = () => {
          if (this.visualSkinState.active.appearanceMode === ThemeAppearanceMode.System) {
            void this.applyVisualState(this.visualSkinState);
          }
        };
        this.mediaQuery.addEventListener('change', this.mediaQueryListener);
      }
    } catch (error) {
      console.error('[ThemeSkin] failed to initialize the theme:', error);
      const fallback = createDefaultThemeSkinState();
      this.appliedSkinState = fallback;
      this.visualSkinState = fallback;
      await this.applyVisualState(fallback);
    }
  }

  async previewSkinState(state: ThemeSkinState): Promise<void> {
    const normalized = normalizeThemeSkinState(
      state,
      state.active.appearanceMode,
      null,
    );
    this.visualSkinState = cloneThemeSkinState(normalized);
    this.currentTheme = normalized.active.appearanceMode;
    await this.applyVisualState(normalized);
    this.notify();
  }

  async commitSkinState(state: ThemeSkinState): Promise<void> {
    const normalized = normalizeThemeSkinState(
      state,
      state.active.appearanceMode,
      null,
    );
    await configService.updateConfig({
      theme: normalized.active.appearanceMode,
      themeSkin: normalized,
    }, {
      syncRuntimeConfig: false,
    });
    this.appliedSkinState = cloneThemeSkinState(normalized);
    this.visualSkinState = cloneThemeSkinState(normalized);
    this.currentTheme = normalized.active.appearanceMode;
    await this.applyVisualState(normalized);
    await window.electron.themeSkin.pruneAssets(
      collectThemeSkinUserAssetIds(normalized),
    );
    this.notify();
  }

  async restoreAppliedSkin(): Promise<void> {
    this.visualSkinState = cloneThemeSkinState(this.appliedSkinState);
    this.currentTheme = this.appliedSkinState.active.appearanceMode;
    await this.applyVisualState(this.appliedSkinState);
    await window.electron.themeSkin.pruneAssets(
      collectThemeSkinUserAssetIds(this.appliedSkinState),
    );
    this.notify();
  }

  getSkinState(): ThemeSkinState {
    return cloneThemeSkinState(this.visualSkinState);
  }

  getAppliedSkinState(): ThemeSkinState {
    return cloneThemeSkinState(this.appliedSkinState);
  }

  getActiveAsset(): ThemeSkinAssetDescriptor | null {
    return this.activeAsset ? { ...this.activeAsset } : null;
  }

  subscribe(listener: ThemeSkinListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setSurfaceMode(mode: SkinSurfaceModeType): void {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.skinSurface = mode;
  }

  setTheme(theme: ThemeAppearanceModeType | string): void {
    const next = this.getSkinState();
    if (
      theme === ThemeAppearanceMode.Light
      || theme === ThemeAppearanceMode.Dark
      || theme === ThemeAppearanceMode.System
    ) {
      next.active.appearanceMode = theme;
    } else {
      const definition = allThemes.find((candidate) => candidate.meta.id === theme);
      if (!definition) return;
      next.active.appearanceMode = definition.meta.appearance;
      next.active.themeIds[definition.meta.appearance] = definition.meta.id;
    }
    void this.previewSkinState(next);
  }

  setThemeById(id: string): void {
    this.setTheme(id);
  }

  restoreTheme(id: string, mode: ThemeAppearanceModeType): void {
    const next = this.getSkinState();
    const definition = allThemes.find((candidate) => candidate.meta.id === id);
    if (definition) {
      next.active.themeIds[definition.meta.appearance] = definition.meta.id;
    }
    next.active.appearanceMode = mode;
    void this.previewSkinState(next);
  }

  getTheme(): ThemeAppearanceModeType {
    return this.currentTheme;
  }

  getThemeId(): string {
    return this.manager.getThemeId();
  }

  getAllThemes(): ThemeDefinition[] {
    return this.manager.getAllThemes();
  }

  getEffectiveTheme(): 'light' | 'dark' {
    return this.manager.getTheme()?.meta.appearance ?? ThemeAppearanceMode.Light;
  }

  private async applyVisualState(state: ThemeSkinState): Promise<void> {
    const version = ++this.applyVersion;
    const prefersDark = this.mediaQuery?.matches ?? false;
    const themeId = getEffectiveThemeId(state.active, prefersDark);
    await this.manager.setTheme(themeId);
    this.applyThemePalette(state.active, null);

    const background = state.active.background;
    let asset: ThemeSkinAssetDescriptor | null = null;
    if (background?.asset.kind === SkinAssetKind.Builtin) {
      asset = getBuiltinThemeSkinAsset(background.asset.id) ?? null;
    }
    if (background?.asset.kind === SkinAssetKind.User) {
      const result = await window.electron.themeSkin.resolveAsset(background.asset.id);
      asset = result.success ? result.asset ?? null : null;
    }
    if (version !== this.applyVersion) return;

    this.activeAsset = asset;
    this.applyThemePalette(state.active, asset);
    this.applySkinCss(state.active, asset);
  }

  private applyThemePalette(
    composition: ThemeSkinComposition,
    asset: ThemeSkinAssetDescriptor | null,
  ): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const properties = [
      '--lobster-primary',
      '--lobster-primary-foreground',
      '--lobster-primary-hover',
      '--lobster-primary-muted',
      '--lobster-accent',
      '--lobster-gradient-1',
      '--lobster-gradient-2',
    ];
    if (composition.paletteMode !== SkinPaletteMode.Image || !asset) {
      properties.forEach((property) => root.style.removeProperty(property));
      return;
    }

    const { primary, accent } = asset.analysis.palette;
    const effectiveTheme = this.manager.getTheme()?.meta.appearance ?? ThemeAppearanceMode.Light;
    const hoverTarget: [number, number, number] = effectiveTheme === ThemeAppearanceMode.Dark
      ? [255, 255, 255]
      : [0, 0, 0];
    const mutedTarget: [number, number, number] = effectiveTheme === ThemeAppearanceMode.Dark
      ? [15, 23, 42]
      : [255, 255, 255];
    root.style.setProperty('--lobster-primary', primary);
    root.style.setProperty('--lobster-primary-foreground', getReadableForeground(primary));
    root.style.setProperty('--lobster-primary-hover', mixHex(primary, hoverTarget, 0.16));
    root.style.setProperty(
      '--lobster-primary-muted',
      mixHex(primary, mutedTarget, effectiveTheme === ThemeAppearanceMode.Dark ? 0.7 : 0.78),
    );
    root.style.setProperty('--lobster-accent', accent);
    const primaryRgb = parseHex(primary);
    const accentRgb = parseHex(accent);
    root.style.setProperty(
      '--lobster-gradient-1',
      primaryRgb ? `rgb(${primaryRgb.join(' ')} / 0.08)` : primary,
    );
    root.style.setProperty(
      '--lobster-gradient-2',
      accentRgb ? `rgb(${accentRgb.join(' ')} / 0.06)` : accent,
    );
  }

  private applySkinCss(
    composition: ThemeSkinComposition,
    asset: ThemeSkinAssetDescriptor | null,
  ): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const background = composition.background;
    if (!background || !asset) {
      root.dataset.themeSkin = 'off';
      root.style.removeProperty('--theme-skin-image');
      return;
    }

    const homeOpacity = background.intensity / 100;
    const taskOpacity = composition.readability.reduceTaskInterference
      ? Math.min(background.intensity, composition.readability.taskIntensity) / 100
      : homeOpacity;
    const utilityOpacity = Math.min(background.intensity, 15) / 100;
    const effectiveTheme = this.manager.getTheme()?.meta.appearance ?? ThemeAppearanceMode.Light;
    const overlayRgb = effectiveTheme === ThemeAppearanceMode.Dark
      ? '5 9 18'
      : '255 255 255';
    const contrastOpacity = getContrastProtectionOpacity(
      asset.analysis.palette.averageLuminance,
      effectiveTheme,
      composition.readability.autoContrast,
    );

    root.dataset.themeSkin = 'on';
    root.style.setProperty('--theme-skin-image', `url("${asset.url}")`);
    root.style.setProperty('--theme-skin-position-x', `${background.focalPoint.x}%`);
    root.style.setProperty('--theme-skin-position-y', `${background.focalPoint.y}%`);
    root.style.setProperty('--theme-skin-size', background.fit);
    root.style.setProperty('--theme-skin-home-opacity', homeOpacity.toFixed(3));
    root.style.setProperty('--theme-skin-task-opacity', taskOpacity.toFixed(3));
    root.style.setProperty('--theme-skin-utility-opacity', utilityOpacity.toFixed(3));
    root.style.setProperty('--theme-skin-overlay-rgb', overlayRgb);
    root.style.setProperty('--theme-skin-contrast-opacity', contrastOpacity.toFixed(3));
    root.style.setProperty(
      '--theme-skin-luminance',
      asset.analysis.palette.averageLuminance.toFixed(3),
    );
  }

  private notify(): void {
    const snapshot = this.getSkinState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const themeService = new ThemeService();

export { SkinSurfaceMode };
