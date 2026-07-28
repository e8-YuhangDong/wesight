import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect, test } from 'vitest';

import {
  isThemeSkinAssetId,
  isThemeSkinFileWithinLimit,
  isThemeSkinImageWithinLimits,
  MAX_THEME_SKIN_ASSET_BYTES,
  normalizeThemeSkinImageExtension,
  pruneManagedThemeSkinAssets,
  resolveManagedThemeSkinAssetPath,
} from './themeSkinAssetPath';

const validAssetId = `${'a'.repeat(64)}.webp`;

test('isThemeSkinAssetId accepts managed image identifiers', () => {
  expect(isThemeSkinAssetId(validAssetId)).toBe(true);
  expect(isThemeSkinAssetId('../../outside.webp')).toBe(false);
  expect(isThemeSkinAssetId(`${'a'.repeat(64)}.svg`)).toBe(false);
});

test('resolveManagedThemeSkinAssetPath keeps assets inside the managed directory', () => {
  const assetsDir = path.join('/tmp', 'wesight-theme-skins');

  expect(resolveManagedThemeSkinAssetPath(assetsDir, validAssetId))
    .toBe(path.join(assetsDir, validAssetId));
  expect(() => resolveManagedThemeSkinAssetPath(assetsDir, '../outside.webp'))
    .toThrow('Invalid theme skin asset identifier');
});

test('isThemeSkinImageWithinLimits enforces dimensions and pixel count', () => {
  expect(isThemeSkinImageWithinLimits(6000, 6000)).toBe(true);
  expect(isThemeSkinImageWithinLimits(12_001, 100)).toBe(false);
  expect(isThemeSkinImageWithinLimits(10_000, 7000)).toBe(false);
  expect(isThemeSkinImageWithinLimits(0, 100)).toBe(false);
});

test('theme skin file validation accepts supported formats and size limit', () => {
  expect(normalizeThemeSkinImageExtension('.png')).toBe('.png');
  expect(normalizeThemeSkinImageExtension('.JPEG')).toBe('.jpg');
  expect(normalizeThemeSkinImageExtension('.webp')).toBe('.webp');
  expect(normalizeThemeSkinImageExtension('.svg')).toBeNull();
  expect(isThemeSkinFileWithinLimit(MAX_THEME_SKIN_ASSET_BYTES)).toBe(true);
  expect(isThemeSkinFileWithinLimit(MAX_THEME_SKIN_ASSET_BYTES + 1)).toBe(false);
});

test('pruneManagedThemeSkinAssets removes only unreferenced managed assets', async () => {
  const assetsDir = await fs.promises.mkdtemp(
    path.join(os.tmpdir(), 'wesight-theme-skins-'),
  );
  const keepAssetId = `${'b'.repeat(64)}.png`;
  const removeAssetId = `${'c'.repeat(64)}.jpg`;
  const unrelatedFile = 'notes.txt';

  try {
    await Promise.all([
      fs.promises.writeFile(path.join(assetsDir, keepAssetId), 'keep'),
      fs.promises.writeFile(path.join(assetsDir, removeAssetId), 'remove'),
      fs.promises.writeFile(path.join(assetsDir, unrelatedFile), 'ignore'),
    ]);

    const removed = await pruneManagedThemeSkinAssets(
      assetsDir,
      new Set([keepAssetId]),
    );

    expect(removed).toBe(1);
    expect(fs.existsSync(path.join(assetsDir, keepAssetId))).toBe(true);
    expect(fs.existsSync(path.join(assetsDir, removeAssetId))).toBe(false);
    expect(fs.existsSync(path.join(assetsDir, unrelatedFile))).toBe(true);
  } finally {
    await fs.promises.rm(assetsDir, { recursive: true, force: true });
  }
});
