import {
  ArrowPathIcon,
  CheckIcon,
  ComputerDesktopIcon,
  CursorArrowRaysIcon,
  MoonIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  SkinAssetKind,
  SkinBackgroundFit,
  SkinPaletteMode,
  SkinSafeArea,
  ThemeAppearanceMode,
  type ThemeSkinAssetDescriptor,
  type ThemeSkinComposition,
  type ThemeSkinPreset,
  type ThemeSkinState,
} from '@shared/theme/constants';
import { getContrastProtectionOpacity } from '@shared/theme/imageAnalysis';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { i18nService } from '../../services/i18n';
import { resolvePublicAssetUrl } from '../../services/publicAssets';
import { themeService } from '../../services/theme';
import {
  BUILTIN_THEME_SKINS,
  getBuiltinThemeSkin,
  getBuiltinThemeSkinAsset,
} from '../../theme/skin/builtins';
import {
  cloneThemeSkinComposition,
} from '../../theme/skin/config';

type PreviewMode = 'home' | 'task';

interface ThemeSkinSettingsProps {
  readOnly?: boolean;
}

const cloneState = (state: ThemeSkinState): ThemeSkinState => ({
  ...state,
  active: cloneThemeSkinComposition(state.active),
  savedSkins: state.savedSkins.map((preset) => ({
    ...preset,
    composition: cloneThemeSkinComposition(preset.composition),
  })),
});

const getAssetErrorKey = (errorCode?: string): string => {
  switch (errorCode) {
    case 'unsupported_type':
      return 'themeSkinErrorUnsupportedType';
    case 'file_too_large':
      return 'themeSkinErrorFileTooLarge';
    case 'invalid_image':
      return 'themeSkinErrorInvalidImage';
    case 'image_too_large':
      return 'themeSkinErrorImageTooLarge';
    default:
      return 'themeSkinErrorImportFailed';
  }
};

const getSafeAreaPoint = (
  safeArea: typeof SkinSafeArea[keyof typeof SkinSafeArea],
  currentY: number,
  automaticPoint: { x: number; y: number },
): { x: number; y: number } => {
  if (safeArea === SkinSafeArea.Auto) return { ...automaticPoint };
  if (safeArea === SkinSafeArea.Left) return { x: 24, y: currentY };
  if (safeArea === SkinSafeArea.Right) return { x: 76, y: currentY };
  return { x: 50, y: currentY };
};

const ThemeSkinSettings: React.FC<ThemeSkinSettingsProps> = ({ readOnly = false }) => {
  const [draft, setDraft] = useState<ThemeSkinState>(() => themeService.getSkinState());
  const [asset, setAsset] = useState<ThemeSkinAssetDescriptor | null>(() =>
    themeService.getActiveAsset());
  const [previewMode, setPreviewMode] = useState<PreviewMode>('home');
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [skinName, setSkinName] = useState('');
  const [namingMode, setNamingMode] = useState<'create' | 'rename' | null>(null);
  const [renamingSkinId, setRenamingSkinId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);

  const allThemes = useMemo(() => themeService.getAllThemes(), []);
  const effectiveAppearance = draft.active.appearanceMode === ThemeAppearanceMode.System
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
      ? ThemeAppearanceMode.Dark
      : ThemeAppearanceMode.Light
    : draft.active.appearanceMode;
  const selectedThemeId = draft.active.themeIds[effectiveAppearance];
  const background = draft.active.background;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      void themeService.restoreAppliedSkin();
    };
  }, []);

  const updateAssetFromService = (): void => {
    if (isMountedRef.current) {
      setAsset(themeService.getActiveAsset());
    }
  };

  const previewState = async (next: ThemeSkinState): Promise<void> => {
    setDraft(next);
    setError(null);
    setSuccess(null);
    await themeService.previewSkinState(next);
    updateAssetFromService();
  };

  const updateComposition = (
    updater: (composition: ThemeSkinComposition) => ThemeSkinComposition,
    options?: { clearPreset?: boolean },
  ): void => {
    const next = cloneState(draft);
    next.active = updater(cloneThemeSkinComposition(next.active));
    if (options?.clearPreset !== false) next.activeSkinId = null;
    void previewState(next);
  };

  const applyPreset = (id: string): void => {
    const builtin = getBuiltinThemeSkin(id);
    const custom = draft.savedSkins.find((preset) => preset.id === id);
    const composition = builtin?.composition ?? custom?.composition;
    if (!composition) return;
    const next = cloneState(draft);
    next.activeSkinId = id;
    next.active = cloneThemeSkinComposition(composition);
    void previewState(next);
  };

  const handleImport = async (): Promise<void> => {
    if (readOnly || isWorking) return;
    const result = await window.electron.dialog.selectFile({
      title: i18nService.t('themeSkinImportBackground'),
      filters: [{
        name: i18nService.t('themeSkinImageFiles'),
        extensions: ['png', 'jpg', 'jpeg', 'webp'],
      }],
    });
    if (!result.success || !result.path) return;

    setIsWorking(true);
    setError(null);
    try {
      const imported = await window.electron.themeSkin.importAsset(result.path);
      if (!imported.success || !imported.asset) {
        setError(i18nService.t(getAssetErrorKey(imported.errorCode)));
        return;
      }
      const next = cloneState(draft);
      next.activeSkinId = null;
      next.active.paletteMode = SkinPaletteMode.Image;
      next.active.background = {
        asset: {
          kind: SkinAssetKind.User,
          id: imported.asset.assetId,
        },
        fit: SkinBackgroundFit.Cover,
        safeArea: SkinSafeArea.Auto,
        focalPoint: { ...imported.asset.analysis.focalPoint },
        intensity: background?.intensity ?? 45,
      };
      await previewState(next);
    } catch (importError) {
      console.error('[ThemeSkin] failed to import a selected image:', importError);
      setError(i18nService.t('themeSkinErrorImportFailed'));
    } finally {
      setIsWorking(false);
    }
  };

  const handleApply = async (): Promise<void> => {
    if (readOnly || isWorking) return;
    setIsWorking(true);
    setError(null);
    try {
      const next = cloneState(draft);
      next.activeSkinId = null;
      await themeService.commitSkinState(next);
      if (isMountedRef.current) {
        setDraft(themeService.getAppliedSkinState());
        setSuccess(i18nService.t('themeSkinApplied'));
      }
    } catch (applyError) {
      console.error('[ThemeSkin] failed to apply the theme skin:', applyError);
      setError(i18nService.t('themeSkinErrorSaveFailed'));
    } finally {
      setIsWorking(false);
    }
  };

  const openCreateDialog = (): void => {
    const nextIndex = draft.savedSkins.length + 1;
    setSkinName(`${i18nService.t('themeSkinCustomName')} ${nextIndex}`);
    setRenamingSkinId(null);
    setNamingMode('create');
  };

  const openRenameDialog = (preset: ThemeSkinPreset): void => {
    setSkinName(preset.name);
    setRenamingSkinId(preset.id);
    setNamingMode('rename');
  };

  const confirmSkinName = async (): Promise<void> => {
    const normalizedName = skinName.trim();
    if (!normalizedName || readOnly || isWorking) return;
    const now = Date.now();
    const next = cloneState(draft);
    if (namingMode === 'rename' && renamingSkinId) {
      next.savedSkins = next.savedSkins.map((preset) =>
        preset.id === renamingSkinId
          ? { ...preset, name: normalizedName, updatedAt: now }
          : preset);
    } else {
      const id = `custom-${crypto.randomUUID()}`;
      next.savedSkins.push({
        id,
        name: normalizedName,
        createdAt: now,
        updatedAt: now,
        composition: cloneThemeSkinComposition(next.active),
      });
      next.activeSkinId = id;
    }

    setIsWorking(true);
    try {
      await themeService.commitSkinState(next);
      if (isMountedRef.current) {
        setDraft(themeService.getAppliedSkinState());
        setNamingMode(null);
        setRenamingSkinId(null);
        setSuccess(i18nService.t(
          namingMode === 'rename' ? 'themeSkinRenamed' : 'themeSkinSaved',
        ));
      }
    } catch (saveError) {
      console.error('[ThemeSkin] failed to save a named skin:', saveError);
      setError(i18nService.t('themeSkinErrorSaveFailed'));
    } finally {
      setIsWorking(false);
    }
  };

  const removeCustomSkin = async (presetId: string): Promise<void> => {
    if (readOnly || isWorking) return;
    const next = cloneState(draft);
    next.savedSkins = next.savedSkins.filter((preset) => preset.id !== presetId);
    if (next.activeSkinId === presetId) next.activeSkinId = null;
    setIsWorking(true);
    try {
      await themeService.commitSkinState(next);
      if (isMountedRef.current) {
        setDraft(themeService.getAppliedSkinState());
        setSuccess(i18nService.t('themeSkinDeleted'));
      }
    } catch (deleteError) {
      console.error('[ThemeSkin] failed to delete a named skin:', deleteError);
      setError(i18nService.t('themeSkinErrorSaveFailed'));
    } finally {
      setIsWorking(false);
    }
  };

  const resetDraft = (): void => {
    const next = cloneState(draft);
    const defaults = themeService.getAppliedSkinState();
    next.activeSkinId = null;
    next.active = {
      ...defaults.active,
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
    void previewState(next);
  };

  const updateSafeArea = (safeArea: typeof SkinSafeArea[keyof typeof SkinSafeArea]): void => {
    if (!background) return;
    const automaticPoint = asset?.analysis.focalPoint ?? { x: 50, y: 50 };
    updateComposition((composition) => ({
      ...composition,
      background: composition.background
        ? {
            ...composition.background,
            safeArea,
            focalPoint: getSafeAreaPoint(
              safeArea,
              composition.background.focalPoint.y,
              automaticPoint,
            ),
          }
        : null,
    }));
  };

  const handlePreviewPointer = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!background || readOnly || !previewRef.current) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    const safeArea = x < 34
      ? SkinSafeArea.Left
      : x > 66
        ? SkinSafeArea.Right
        : SkinSafeArea.Center;
    updateComposition((composition) => ({
      ...composition,
      background: composition.background
        ? {
            ...composition.background,
            safeArea,
            focalPoint: { x, y },
          }
        : null,
    }));
  };

  const previewIntensity = background
    ? previewMode === 'task' && draft.active.readability.reduceTaskInterference
      ? Math.min(background.intensity, draft.active.readability.taskIntensity)
      : background.intensity
    : 0;
  const previewWallpaperStyle = asset && background
    ? {
        backgroundImage: `url("${asset.url}")`,
        backgroundPosition: `${background.focalPoint.x}% ${background.focalPoint.y}%`,
        backgroundSize: background.fit,
        opacity: previewIntensity / 100,
      }
    : undefined;
  const previewContrastOpacity = asset
    ? getContrastProtectionOpacity(
        asset.analysis.palette.averageLuminance,
        effectiveAppearance,
        draft.active.readability.autoContrast,
      )
    : 0;
  const previewOverlayColor = effectiveAppearance === ThemeAppearanceMode.Dark
    ? 'rgb(5 9 18)'
    : 'rgb(255 255 255)';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-5">
        <p className="mb-4 text-sm text-secondary">
          {i18nService.t('themeSkinSubtitle')}
        </p>

        <div
          ref={previewRef}
          className="relative min-h-[300px] overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface-raised to-background shadow-subtle"
          onPointerDown={handlePreviewPointer}
        >
          {previewWallpaperStyle && (
            <div
              className="absolute inset-0 bg-no-repeat transition-opacity duration-200"
              style={previewWallpaperStyle}
            />
          )}
          {asset && background && (
            <div
              className="absolute inset-0 transition-opacity duration-200"
              style={{
                backgroundColor: previewOverlayColor,
                opacity: previewContrastOpacity,
              }}
            />
          )}
          <div className="relative flex min-h-[300px]">
            <div className="hidden w-[168px] shrink-0 border-r border-black/10 bg-surface/60 p-4 backdrop-blur-xl sm:block">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <img
                  src={resolvePublicAssetUrl('logo.png')}
                  alt=""
                  className="h-6 w-6 rounded-md"
                />
                WeSight
              </div>
              <div className="mt-5 space-y-2 text-[11px] text-secondary">
                {['themeSkinPreviewNewTask', 'themeSkinPreviewSearch', 'themeSkinPreviewSchedule', 'themeSkinPreviewSkills'].map((key) => (
                  <div key={key} className="rounded-md px-2 py-1.5 hover:bg-surface/60">
                    {i18nService.t(key)}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex h-11 items-center justify-between border-b border-black/10 bg-surface/35 px-4 text-[11px] text-secondary backdrop-blur-md">
                <span>{i18nService.t('themeSkinPreviewLocalAgent')}</span>
                <span className="inline-flex items-center gap-1 text-success">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  {i18nService.t('themeSkinPreviewProtected')}
                </span>
              </div>
              <div className="absolute right-4 top-14 z-10 flex rounded-xl border border-white/50 bg-surface/75 p-1 text-xs shadow-md backdrop-blur-md">
                {(['home', 'task'] as PreviewMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`rounded-lg px-5 py-1.5 transition-colors ${
                      previewMode === mode ? 'bg-background text-primary shadow-sm' : 'text-secondary'
                    }`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setPreviewMode(mode)}
                  >
                    {i18nService.t(mode === 'home' ? 'themeSkinPreviewHome' : 'themeSkinPreviewTask')}
                  </button>
                ))}
              </div>

              {previewMode === 'home' ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
                  <img
                    src={resolvePublicAssetUrl('logo.png')}
                    alt=""
                    className="h-12 w-12 rounded-xl shadow-lg"
                  />
                  <h3 className="mt-3 text-2xl font-semibold text-foreground">
                    {i18nService.t('themeSkinPreviewStart')}
                  </h3>
                  <p className="mt-1 text-xs text-secondary">
                    {i18nService.t('themeSkinPreviewDescription')}
                  </p>
                  <div className="mt-5 w-full max-w-[560px] rounded-2xl border border-white/60 bg-surface/85 p-4 text-left text-sm text-secondary shadow-lg backdrop-blur-xl">
                    {i18nService.t('themeSkinPreviewPlaceholder')}
                    <div className="mt-8 flex items-center justify-between text-[11px]">
                      <span>{i18nService.t('themeSkinPreviewFolder')}</span>
                      <span className="rounded-full bg-primary px-3 py-1 text-white">→</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-3 px-8 pb-7 pt-20">
                  <div className="self-end rounded-2xl bg-primary px-4 py-2 text-sm text-white shadow-sm">
                    {i18nService.t('themeSkinPreviewUserMessage')}
                  </div>
                  <div className="max-w-[82%] rounded-2xl border border-border bg-surface/90 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur-lg">
                    <p className="font-medium">{i18nService.t('themeSkinPreviewAssistantTitle')}</p>
                    <p className="mt-1 text-xs leading-5 text-secondary">
                      {i18nService.t('themeSkinPreviewAssistantBody')}
                    </p>
                  </div>
                  <div className="mt-auto rounded-xl border border-border bg-surface/95 px-4 py-3 text-xs text-secondary shadow-md">
                    {i18nService.t('themeSkinPreviewContinue')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {background && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35 p-1.5 text-white shadow-lg backdrop-blur-sm"
              style={{
                left: `${background.focalPoint.x}%`,
                top: `${background.focalPoint.y}%`,
              }}
            >
              <CursorArrowRaysIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">
              {i18nService.t('themeSkinPresets')}
            </h4>
            <span className="text-xs text-muted">{i18nService.t('themeSkinPresetsHint')}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {BUILTIN_THEME_SKINS.map((skin) => (
              <button
                key={skin.id}
                type="button"
                disabled={readOnly}
                onClick={() => applyPreset(skin.id)}
                className={`group min-w-[176px] overflow-hidden rounded-xl border text-left transition-all ${
                  draft.activeSkinId === skin.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img src={skin.asset.url} alt="" className="h-20 w-full object-cover" />
                <span className="block bg-surface px-3 py-2 text-xs font-medium text-foreground">
                  {i18nService.t(skin.nameKey)}
                </span>
              </button>
            ))}
            {draft.savedSkins.map((preset) => {
              const builtinAsset = preset.composition.background?.asset.kind === SkinAssetKind.Builtin
                ? getBuiltinThemeSkinAsset(preset.composition.background.asset.id)
                : null;
              const isActiveAsset = draft.activeSkinId === preset.id ? asset : null;
              return (
                <div
                  key={preset.id}
                  className={`group relative min-w-[176px] overflow-hidden rounded-xl border bg-surface ${
                    draft.activeSkinId === preset.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border'
                  }`}
                >
                  <button
                    type="button"
                    className="block w-full text-left"
                    onClick={() => applyPreset(preset.id)}
                    disabled={readOnly}
                  >
                    {builtinAsset || isActiveAsset ? (
                      <img
                        src={(builtinAsset ?? isActiveAsset)?.url}
                        alt=""
                        className="h-20 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-20 items-center justify-center bg-surface-raised text-muted">
                        <PhotoIcon className="h-6 w-6" />
                      </div>
                    )}
                    <span className="block truncate px-3 py-2 pr-14 text-xs font-medium text-foreground">
                      {preset.name}
                    </span>
                  </button>
                  <div className="absolute bottom-1.5 right-1.5 flex gap-1">
                    <button
                      type="button"
                      aria-label={i18nService.t('rename')}
                      className="rounded-md p-1 text-muted hover:bg-surface-raised hover:text-foreground"
                      onClick={() => openRenameDialog(preset)}
                    >
                      <PencilSquareIcon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label={i18nService.t('delete')}
                      className="rounded-md p-1 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                      onClick={() => void removeCustomSkin(preset.id)}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <section className="rounded-2xl border border-border bg-surface/70 p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">1</span>
              <h4 className="text-sm font-semibold text-foreground">{i18nService.t('themeSkinBaseAppearance')}</h4>
            </div>
            <div className="grid grid-cols-3 overflow-hidden rounded-lg border border-border">
              {[
                { mode: ThemeAppearanceMode.Light, icon: SunIcon, key: 'light' },
                { mode: ThemeAppearanceMode.Dark, icon: MoonIcon, key: 'dark' },
                { mode: ThemeAppearanceMode.System, icon: ComputerDesktopIcon, key: 'system' },
              ].map(({ mode, icon: Icon, key }) => (
                <button
                  key={mode}
                  type="button"
                  disabled={readOnly}
                  onClick={() => updateComposition((composition) => ({
                    ...composition,
                    appearanceMode: mode,
                  }))}
                  className={`flex items-center justify-center gap-1 border-r border-border px-2 py-2 text-xs last:border-r-0 ${
                    draft.active.appearanceMode === mode
                      ? 'bg-primary-muted text-primary'
                      : 'text-secondary hover:bg-surface-raised'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {i18nService.t(key)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              {allThemes.map((theme) => {
                const selected = selectedThemeId === theme.meta.id;
                const [backgroundColor, firstColor, secondColor, accentColor] = theme.meta.preview;
                return (
                  <button
                    key={theme.meta.id}
                    type="button"
                    disabled={readOnly}
                    onClick={() => updateComposition((composition) => {
                      const next = cloneThemeSkinComposition(composition);
                      next.themeIds[theme.meta.appearance] = theme.meta.id;
                      if (next.appearanceMode !== ThemeAppearanceMode.System) {
                        next.appearanceMode = theme.meta.appearance;
                      }
                      next.paletteMode = SkinPaletteMode.Theme;
                      return next;
                    })}
                    className={`min-w-[70px] rounded-xl border p-2 text-center ${
                      selected && draft.active.paletteMode === SkinPaletteMode.Theme
                        ? 'border-primary ring-2 ring-primary/15'
                        : 'border-border'
                    }`}
                  >
                    <span
                      className="mx-auto block h-10 w-12 rounded-lg border border-black/5"
                      style={{ backgroundColor }}
                    >
                      <span
                        className="m-1 inline-block h-4 w-4 rounded-full"
                        style={{ backgroundColor: accentColor }}
                      />
                      <span className="block h-1" style={{ backgroundColor: firstColor }} />
                      <span className="mt-1 block h-1" style={{ backgroundColor: secondColor }} />
                    </span>
                    <span className="mt-1 block max-w-[60px] truncate text-[10px] text-secondary">
                      {i18nService.t(theme.meta.nameKey)}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={readOnly || !background}
              onClick={() => updateComposition((composition) => ({
                ...composition,
                paletteMode: composition.paletteMode === SkinPaletteMode.Image
                  ? SkinPaletteMode.Theme
                  : SkinPaletteMode.Image,
              }))}
              className={`mt-1 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                draft.active.paletteMode === SkinPaletteMode.Image
                  ? 'border-primary bg-primary-muted text-primary'
                  : 'border-border text-secondary'
              } disabled:opacity-50`}
            >
              <span className="inline-flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                {i18nService.t('themeSkinAutoPalette')}
              </span>
              {draft.active.paletteMode === SkinPaletteMode.Image && <CheckIcon className="h-4 w-4" />}
            </button>
          </section>

          <section className="rounded-2xl border border-border bg-surface/70 p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">2</span>
              <h4 className="text-sm font-semibold text-foreground">{i18nService.t('themeSkinBackgroundAtmosphere')}</h4>
            </div>

            <div className="flex items-start gap-3">
              {asset ? (
                <img src={asset.url} alt="" className="h-20 w-24 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-24 items-center justify-center rounded-xl border border-dashed border-border bg-surface-raised text-muted">
                  <PhotoIcon className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-1 flex-wrap gap-2">
                <button type="button" className="btn-secondary px-3 py-1.5 text-xs" onClick={() => void handleImport()} disabled={readOnly || isWorking}>
                  <PlusIcon className="mr-1 inline h-3.5 w-3.5" />
                  {i18nService.t(asset ? 'themeSkinChangeImage' : 'themeSkinImportImage')}
                </button>
                {background && (
                  <button
                    type="button"
                    className="rounded-lg border border-border p-1.5 text-muted hover:text-red-600"
                    onClick={() => updateComposition((composition) => ({
                      ...composition,
                      background: null,
                      paletteMode: SkinPaletteMode.Theme,
                    }))}
                    disabled={readOnly}
                    aria-label={i18nService.t('themeSkinRemoveImage')}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
                <div className="flex w-full rounded-lg border border-border p-0.5">
                  {[SkinBackgroundFit.Cover, SkinBackgroundFit.Contain].map((fit) => (
                    <button
                      key={fit}
                      type="button"
                      disabled={readOnly || !background}
                      className={`flex-1 rounded-md px-2 py-1.5 text-xs ${
                        background?.fit === fit ? 'bg-primary-muted text-primary' : 'text-secondary'
                      }`}
                      onClick={() => updateComposition((composition) => ({
                        ...composition,
                        background: composition.background
                          ? { ...composition.background, fit }
                          : null,
                      }))}
                    >
                      {i18nService.t(fit === SkinBackgroundFit.Cover ? 'themeSkinFill' : 'themeSkinFit')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <label className="mt-4 block text-xs font-medium text-secondary">
              {i18nService.t('themeSkinSubjectSafeArea')}
            </label>
            <div className="mt-2 grid grid-cols-4 overflow-hidden rounded-lg border border-border">
              {[
                SkinSafeArea.Auto,
                SkinSafeArea.Left,
                SkinSafeArea.Center,
                SkinSafeArea.Right,
              ].map((safeArea) => (
                <button
                  key={safeArea}
                  type="button"
                  disabled={readOnly || !background}
                  onClick={() => updateSafeArea(safeArea)}
                  className={`border-r border-border px-1 py-2 text-[11px] last:border-r-0 ${
                    background?.safeArea === safeArea
                      ? 'bg-primary-muted text-primary'
                      : 'text-secondary'
                  }`}
                >
                  {i18nService.t(`themeSkinSafeArea${safeArea[0].toUpperCase()}${safeArea.slice(1)}`)}
                </button>
              ))}
            </div>

            <label className="mt-4 flex items-center justify-between text-xs font-medium text-secondary">
              <span>{i18nService.t('themeSkinBackgroundIntensity')}</span>
              <span>{Math.round(background?.intensity ?? 0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={background?.intensity ?? 0}
              disabled={readOnly || !background}
              onChange={(event) => updateComposition((composition) => ({
                ...composition,
                background: composition.background
                  ? { ...composition.background, intensity: Number(event.target.value) }
                  : null,
              }))}
              className="mt-2 w-full accent-primary"
            />
          </section>

          <section className="rounded-2xl border border-border bg-surface/70 p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">3</span>
              <h4 className="text-sm font-semibold text-foreground">{i18nService.t('themeSkinReadability')}</h4>
            </div>

            {[
              {
                key: 'autoContrast' as const,
                label: 'themeSkinAutoContrast',
                description: 'themeSkinAutoContrastDescription',
              },
              {
                key: 'reduceTaskInterference' as const,
                label: 'themeSkinReduceTaskInterference',
                description: 'themeSkinReduceTaskInterferenceDescription',
              },
            ].map((item) => (
              <label key={item.key} className="flex items-start justify-between gap-3 border-b border-border py-3 first:pt-0">
                <span>
                  <span className="block text-xs font-medium text-foreground">{i18nService.t(item.label)}</span>
                  <span className="mt-1 block text-[11px] leading-4 text-muted">{i18nService.t(item.description)}</span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.active.readability[item.key]}
                  disabled={readOnly}
                  onClick={() => updateComposition((composition) => ({
                    ...composition,
                    readability: {
                      ...composition.readability,
                      [item.key]: !composition.readability[item.key],
                    },
                  }))}
                  className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors ${
                    draft.active.readability[item.key] ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    draft.active.readability[item.key] ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </label>
            ))}

            <label className="mt-4 flex items-center justify-between text-xs font-medium text-secondary">
              <span>{i18nService.t('themeSkinTaskIntensity')}</span>
              <span>{Math.round(draft.active.readability.taskIntensity)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={draft.active.readability.taskIntensity}
              disabled={readOnly || !draft.active.readability.reduceTaskInterference}
              onChange={(event) => updateComposition((composition) => ({
                ...composition,
                readability: {
                  ...composition.readability,
                  taskIntensity: Number(event.target.value),
                },
              }))}
              className="mt-2 w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-[10px] text-muted">
              <span>{i18nService.t('themeSkinLowInterference')}</span>
              <span>{i18nService.t('themeSkinHighInterference')}</span>
            </div>
          </section>
        </div>
      </div>

      {(error || success) && (
        <div className={`mx-6 mb-3 rounded-lg px-3 py-2 text-xs ${
          error
            ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
            : 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
        }`}>
          {error ?? success}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border bg-background px-6 py-4">
        <div className="flex min-w-0 items-center gap-2 text-xs text-secondary">
          <SparklesIcon className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">
            {i18nService.t('themeSkinCurrentCombination')}
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-secondary inline-flex items-center px-4 py-2 text-sm" onClick={resetDraft} disabled={readOnly || isWorking}>
            <ArrowPathIcon className="mr-1.5 h-4 w-4" />
            {i18nService.t('themeSkinRestoreDefault')}
          </button>
          <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => void handleApply()} disabled={readOnly || isWorking}>
            {i18nService.t('themeSkinApplyOnly')}
          </button>
          <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={openCreateDialog} disabled={readOnly || isWorking}>
            {i18nService.t('themeSkinSaveAsSkin')}
          </button>
        </div>
      </div>

      {namingMode && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-modal">
            <h4 className="text-base font-semibold text-foreground">
              {i18nService.t(namingMode === 'rename' ? 'themeSkinRenameTitle' : 'themeSkinSaveTitle')}
            </h4>
            <input
              autoFocus
              value={skinName}
              maxLength={40}
              onChange={(event) => setSkinName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void confirmSkinName();
                if (event.key === 'Escape') setNamingMode(null);
              }}
              className="mt-4 w-full rounded-xl border border-input-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setNamingMode(null)}>
                {i18nService.t('cancel')}
              </button>
              <button type="button" className="btn-primary px-4 py-2 text-sm" disabled={!skinName.trim() || isWorking} onClick={() => void confirmSkinName()}>
                {i18nService.t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSkinSettings;
