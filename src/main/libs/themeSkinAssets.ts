import { createHash } from 'crypto';
import { BrowserWindow, nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';

import {
  type ThemeSkinAssetDescriptor,
  ThemeSkinAssetErrorCode,
  type ThemeSkinAssetResult,
  type ThemeSkinPruneResult,
} from '../../shared/theme/constants';
import { analyzeBgraBitmap } from '../../shared/theme/imageAnalysis';
import {
  isThemeSkinAssetId,
  isThemeSkinFileWithinLimit,
  isThemeSkinImageWithinLimits,
  normalizeThemeSkinImageExtension,
  pruneManagedThemeSkinAssets,
  resolveManagedThemeSkinAssetPath,
} from './themeSkinAssetPath';

const ANALYSIS_EDGE = 64;

const toLocalFileUrl = (filePath: string): string => {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return `localfile://${encodeURI(normalizedPath)}`;
};

const getImageMimeType = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
};

const getErrorResult = (
  errorCode: ThemeSkinAssetResult['errorCode'],
  error?: unknown,
): ThemeSkinAssetResult => ({
  success: false,
  errorCode,
  error: error instanceof Error ? error.message : undefined,
});

export class ThemeSkinAssetStore {
  private readonly assetsDir: string;

  constructor(userDataPath: string) {
    this.assetsDir = path.join(userDataPath, 'theme-skins', 'assets');
  }

  async importAsset(sourcePathValue: unknown): Promise<ThemeSkinAssetResult> {
    if (typeof sourcePathValue !== 'string' || !sourcePathValue.trim()) {
      return getErrorResult(ThemeSkinAssetErrorCode.MissingPath);
    }

    try {
      const sourcePath = path.resolve(sourcePathValue.trim());
      const stat = await fs.promises.stat(sourcePath);
      if (!stat.isFile()) {
        return getErrorResult(ThemeSkinAssetErrorCode.NotFile);
      }
      if (!isThemeSkinFileWithinLimit(stat.size)) {
        return getErrorResult(ThemeSkinAssetErrorCode.FileTooLarge);
      }

      const sourceExtension = path.extname(sourcePath).toLowerCase();
      const normalizedExtension = normalizeThemeSkinImageExtension(sourceExtension);
      if (!normalizedExtension) {
        return getErrorResult(ThemeSkinAssetErrorCode.UnsupportedType);
      }

      const buffer = await fs.promises.readFile(sourcePath);
      const decoded = await this.decodeImage(sourcePath, buffer);
      if (!decoded) {
        return getErrorResult(ThemeSkinAssetErrorCode.InvalidImage);
      }
      const size = decoded.sourceSize;
      if (!isThemeSkinImageWithinLimits(size.width, size.height)) {
        return getErrorResult(ThemeSkinAssetErrorCode.ImageTooLarge);
      }

      const digest = createHash('sha256').update(buffer).digest('hex');
      const assetId = `${digest}${normalizedExtension}`;
      await fs.promises.mkdir(this.assetsDir, { recursive: true });
      const targetPath = path.join(this.assetsDir, assetId);
      try {
        await fs.promises.copyFile(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'EEXIST') throw error;
      }

      const asset = await this.describeAsset(
        assetId,
        decoded.image,
        stat.size,
        decoded.sourceSize,
      );
      console.log('[ThemeSkin] imported a background asset');
      return {
        success: true,
        asset,
      };
    } catch (error) {
      console.error('[ThemeSkin] failed to import a background asset:', error);
      return getErrorResult(ThemeSkinAssetErrorCode.ImportFailed, error);
    }
  }

  async resolveAsset(assetIdValue: unknown): Promise<ThemeSkinAssetResult> {
    if (!isThemeSkinAssetId(assetIdValue)) {
      return getErrorResult(ThemeSkinAssetErrorCode.InvalidAssetId);
    }

    try {
      const assetPath = this.resolveAssetPath(assetIdValue);
      const stat = await fs.promises.stat(assetPath);
      if (!stat.isFile()) {
        return getErrorResult(ThemeSkinAssetErrorCode.AssetNotFound);
      }
      const buffer = await fs.promises.readFile(assetPath);
      const decoded = await this.decodeImage(assetPath, buffer);
      if (!decoded) {
        return getErrorResult(ThemeSkinAssetErrorCode.InvalidImage);
      }
      return {
        success: true,
        asset: await this.describeAsset(
          assetIdValue,
          decoded.image,
          stat.size,
          decoded.sourceSize,
        ),
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        return getErrorResult(ThemeSkinAssetErrorCode.AssetNotFound);
      }
      console.error('[ThemeSkin] failed to resolve a background asset:', error);
      return getErrorResult(ThemeSkinAssetErrorCode.ResolveFailed, error);
    }
  }

  async pruneAssets(keepAssetIdsValue: unknown): Promise<ThemeSkinPruneResult> {
    try {
      const keepAssetIds = new Set(
        Array.isArray(keepAssetIdsValue)
          ? keepAssetIdsValue.filter(
              (assetId): assetId is string =>
                isThemeSkinAssetId(assetId),
            )
          : [],
      );
      const removed = await pruneManagedThemeSkinAssets(this.assetsDir, keepAssetIds);
      if (removed > 0) {
        console.log(`[ThemeSkin] removed ${removed} unused background asset${removed === 1 ? '' : 's'}`);
      }
      return {
        success: true,
        removed,
      };
    } catch (error) {
      console.error('[ThemeSkin] failed to clean unused background assets:', error);
      return {
        success: false,
        errorCode: ThemeSkinAssetErrorCode.PruneFailed,
        error: error instanceof Error ? error.message : undefined,
      };
    }
  }

  private resolveAssetPath(assetId: string): string {
    return resolveManagedThemeSkinAssetPath(this.assetsDir, assetId);
  }

  private async describeAsset(
    assetId: string,
    image: Electron.NativeImage,
    sizeBytes: number,
    sourceSize = image.getSize(),
  ): Promise<ThemeSkinAssetDescriptor> {
    const sampleSize = image.getSize();
    const analysisImage = sampleSize.width >= sampleSize.height
      ? image.resize({ width: ANALYSIS_EDGE, quality: 'good' })
      : image.resize({ height: ANALYSIS_EDGE, quality: 'good' });
    const analysisSize = analysisImage.getSize();
    const analysis = analyzeBgraBitmap(
      analysisImage.toBitmap(),
      analysisSize.width,
      analysisSize.height,
    );
    return {
      assetId,
      url: toLocalFileUrl(this.resolveAssetPath(assetId)),
      width: sourceSize.width,
      height: sourceSize.height,
      sizeBytes,
      analysis,
    };
  }

  private async decodeImage(
    filePath: string,
    buffer: Buffer,
  ): Promise<{
    image: Electron.NativeImage;
    sourceSize: { width: number; height: number };
  } | null> {
    const nativeDecoded = nativeImage.createFromBuffer(buffer);
    if (!nativeDecoded.isEmpty()) {
      return {
        image: nativeDecoded,
        sourceSize: nativeDecoded.getSize(),
      };
    }

    const decoderWindow = new BrowserWindow({
      show: false,
      width: ANALYSIS_EDGE,
      height: ANALYSIS_EDGE,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        offscreen: true,
      },
    });

    try {
      await decoderWindow.loadURL('about:blank');
      const dataUrl = `data:${getImageMimeType(filePath)};base64,${buffer.toString('base64')}`;
      const decoded = await decoderWindow.webContents.executeJavaScript(`
        (() => new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => {
            const sourceWidth = image.naturalWidth;
            const sourceHeight = image.naturalHeight;
            const scale = Math.min(1, ${ANALYSIS_EDGE} / Math.max(sourceWidth, sourceHeight));
            const width = Math.max(1, Math.round(sourceWidth * scale));
            const height = Math.max(1, Math.round(sourceHeight * scale));
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            if (!context) {
              reject(new Error('Canvas context is unavailable'));
              return;
            }
            context.drawImage(image, 0, 0, width, height);
            resolve({
              width: sourceWidth,
              height: sourceHeight,
              dataUrl: canvas.toDataURL('image/png'),
            });
          };
          image.onerror = () => reject(new Error('Image decode failed'));
          image.src = ${JSON.stringify(dataUrl)};
        }))()
      `, true) as { width?: unknown; height?: unknown; dataUrl?: unknown };

      if (
        typeof decoded.width !== 'number'
        || typeof decoded.height !== 'number'
        || typeof decoded.dataUrl !== 'string'
      ) {
        return null;
      }
      const image = nativeImage.createFromDataURL(decoded.dataUrl);
      if (image.isEmpty()) return null;
      return {
        image,
        sourceSize: {
          width: Math.round(decoded.width),
          height: Math.round(decoded.height),
        },
      };
    } catch {
      return null;
    } finally {
      decoderWindow.destroy();
    }
  }
}
