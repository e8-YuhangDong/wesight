import fs from 'fs';
import path from 'path';

export const THEME_SKIN_ASSET_ID_PATTERN = /^[a-f0-9]{64}\.(?:png|jpg|webp)$/;
export const MAX_THEME_SKIN_ASSET_BYTES = 20 * 1024 * 1024;

const SUPPORTED_THEME_SKIN_EXTENSIONS = new Map([
  ['.png', '.png'],
  ['.jpg', '.jpg'],
  ['.jpeg', '.jpg'],
  ['.webp', '.webp'],
]);

export const normalizeThemeSkinImageExtension = (extension: string): string | null =>
  SUPPORTED_THEME_SKIN_EXTENSIONS.get(extension.toLowerCase()) ?? null;

export const isThemeSkinFileWithinLimit = (sizeBytes: number): boolean =>
  Number.isFinite(sizeBytes) && sizeBytes >= 0 && sizeBytes <= MAX_THEME_SKIN_ASSET_BYTES;

export const isThemeSkinAssetId = (value: unknown): value is string =>
  typeof value === 'string' && THEME_SKIN_ASSET_ID_PATTERN.test(value);

export const resolveManagedThemeSkinAssetPath = (
  assetsDir: string,
  assetId: string,
): string => {
  if (!isThemeSkinAssetId(assetId)) {
    throw new Error('Invalid theme skin asset identifier');
  }
  const assetPath = path.resolve(assetsDir, assetId);
  const relativePath = path.relative(assetsDir, assetPath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error('Theme skin asset is outside the managed directory');
  }
  return assetPath;
};

export const isThemeSkinImageWithinLimits = (
  width: number,
  height: number,
): boolean =>
  width > 0
  && height > 0
  && width <= 12_000
  && height <= 12_000
  && width * height <= 60_000_000;

export const pruneManagedThemeSkinAssets = async (
  assetsDir: string,
  keepAssetIds: ReadonlySet<string>,
): Promise<number> => {
  await fs.promises.mkdir(assetsDir, { recursive: true });
  const entries = await fs.promises.readdir(assetsDir, { withFileTypes: true });
  let removed = 0;
  for (const entry of entries) {
    if (
      !entry.isFile()
      || !THEME_SKIN_ASSET_ID_PATTERN.test(entry.name)
      || keepAssetIds.has(entry.name)
    ) {
      continue;
    }
    await fs.promises.unlink(resolveManagedThemeSkinAssetPath(assetsDir, entry.name));
    removed += 1;
  }
  return removed;
};
