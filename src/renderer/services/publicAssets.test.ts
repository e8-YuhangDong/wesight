import { expect, test } from 'vitest';

import { resolvePublicAssetUrl } from './publicAssets';

test('resolves packaged public assets relative to the renderer document', () => {
  const packagedRendererUrl =
    'file:///Applications/WeSight.app/Contents/Resources/app.asar/dist/index.html';

  expect(resolvePublicAssetUrl(
    '/theme-skins/cloudridge-dawn.webp',
    packagedRendererUrl,
  )).toBe(
    'file:///Applications/WeSight.app/Contents/Resources/app.asar/dist/theme-skins/cloudridge-dawn.webp',
  );
  expect(resolvePublicAssetUrl('/logo.png', packagedRendererUrl))
    .toBe('file:///Applications/WeSight.app/Contents/Resources/app.asar/dist/logo.png');
});

test('keeps development and hosted base paths intact', () => {
  expect(resolvePublicAssetUrl('logo.png', 'http://localhost:5175/'))
    .toBe('http://localhost:5175/logo.png');
  expect(resolvePublicAssetUrl(
    '/theme-skins/cloudridge-dawn.webp',
    'https://example.com/wesight/',
  )).toBe('https://example.com/wesight/theme-skins/cloudridge-dawn.webp');
});
