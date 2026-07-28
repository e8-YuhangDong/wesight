import { createRequire } from 'node:module';

import { describe, expect, test } from 'vitest';

const require = createRequire(import.meta.url);
const { MacArtifactTarget, shouldInspectNativeModule } = require('./verify-mac-artifact.cjs');

describe('macOS native module artifact filtering', () => {
  test.each([
    ['@img/sharp-darwin-x64/lib/sharp-darwin-x64.node', MacArtifactTarget.X64],
    ['vendor/ripgrep/x64-darwin/ripgrep.node', MacArtifactTarget.X64],
    ['@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node', MacArtifactTarget.Arm64],
    ['vendor/ripgrep/arm64-darwin/ripgrep.node', MacArtifactTarget.Arm64],
  ])('inspects matching target module %s', (modulePath, artifactTarget) => {
    expect(shouldInspectNativeModule(modulePath, artifactTarget)).toBe(true);
  });

  test.each([
    'bufferutil/prebuilds/win32-ia32/bufferutil.node',
    'bufferutil/prebuilds/win32-x64/bufferutil.node',
    'utf-8-validate/prebuilds/linux-x64/validation.node',
    '@img/sharp-darwin-arm64/lib/sharp-darwin-arm64.node',
  ])('skips non-target x64 module %s', modulePath => {
    expect(shouldInspectNativeModule(modulePath, MacArtifactTarget.X64)).toBe(false);
  });

  test.each([
    'bufferutil/prebuilds/win32-ia32/bufferutil.node',
    'bufferutil/prebuilds/win32-arm64/bufferutil.node',
    'utf-8-validate/prebuilds/linux-arm64/validation.node',
    '@img/sharp-darwin-x64/lib/sharp-darwin-x64.node',
  ])('skips non-target ARM64 module %s', modulePath => {
    expect(shouldInspectNativeModule(modulePath, MacArtifactTarget.Arm64)).toBe(false);
  });

  test.each([
    [
      'app.asar.unpacked/node_modules/better-sqlite3/build/Release/better_sqlite3.node',
      MacArtifactTarget.X64,
    ],
    [
      'app.asar.unpacked/node_modules/better-sqlite3/build/Release/better_sqlite3.node',
      MacArtifactTarget.Arm64,
    ],
  ])('inspects generic module %s', (modulePath, artifactTarget) => {
    expect(shouldInspectNativeModule(modulePath, artifactTarget)).toBe(true);
  });
});
