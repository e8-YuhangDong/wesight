import { afterEach, describe, expect, it, vi } from 'vitest';

import handler, { resolveInstallerTarget, selectInstaller } from './download.js';

const trustedReleaseUrl = 'https://github.com/freestylefly/wesight/releases/download/v1.0.1/';

const assets = [
  {
    name: 'WeSight.1.0.1.mac.arm64.dmg',
    browser_download_url: `${trustedReleaseUrl}WeSight.1.0.1.mac.arm64.dmg`,
  },
  {
    name: 'WeSight.1.0.1.mac.x64.dmg',
    browser_download_url: `${trustedReleaseUrl}WeSight.1.0.1.mac.x64.dmg`,
  },
  {
    name: 'WeSight.Setup.1.0.1.exe.blockmap',
    browser_download_url: `${trustedReleaseUrl}WeSight.Setup.1.0.1.exe.blockmap`,
  },
  {
    name: 'WeSight.Setup.1.0.1.exe',
    browser_download_url: `${trustedReleaseUrl}WeSight.Setup.1.0.1.exe`,
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolveInstallerTarget', () => {
  it('resolves existing macOS download routes', () => {
    expect(resolveInstallerTarget({ arch: 'arm64' })).toBe('macArm64');
    expect(resolveInstallerTarget({ arch: ['x64'] })).toBe('macX64');
  });

  it('resolves Windows x64 with an optional architecture', () => {
    expect(resolveInstallerTarget({ platform: 'windows' })).toBe('windowsX64');
    expect(resolveInstallerTarget({ platform: 'windows', arch: 'x64' })).toBe('windowsX64');
  });

  it('rejects unsupported platform and architecture combinations', () => {
    expect(resolveInstallerTarget({ platform: 'windows', arch: 'arm64' })).toBeNull();
    expect(resolveInstallerTarget({ platform: 'linux', arch: 'x64' })).toBeNull();
    expect(resolveInstallerTarget({})).toBeNull();
  });
});

describe('selectInstaller', () => {
  it('selects the Windows installer without matching its blockmap', () => {
    expect(selectInstaller(assets, 'windowsX64')?.name).toBe('WeSight.Setup.1.0.1.exe');
  });

  it('selects both supported macOS installers', () => {
    expect(selectInstaller(assets, 'macArm64')?.name).toBe('WeSight.1.0.1.mac.arm64.dmg');
    expect(selectInstaller(assets, 'macX64')?.name).toBe('WeSight.1.0.1.mac.x64.dmg');
  });

  it('rejects installer URLs outside the WeSight GitHub Releases path', () => {
    expect(
      selectInstaller(
        [
          {
            name: 'WeSight.Setup.1.0.1.exe',
            browser_download_url: 'https://example.com/WeSight.Setup.1.0.1.exe',
          },
        ],
        'windowsX64',
      ),
    ).toBeNull();
  });
});

it('redirects a Windows request to the latest trusted EXE asset', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ assets }),
    })),
  );

  const headers = new Map<string, string>();
  const response = {
    statusCode: 0,
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    end() {},
  };

  await handler({ query: { platform: 'windows', arch: 'x64' } }, response);

  expect(response.statusCode).toBe(302);
  expect(headers.get('Location')).toBe(`${trustedReleaseUrl}WeSight.Setup.1.0.1.exe`);
  expect(headers.get('Cache-Control')).toBe('s-maxage=300, stale-while-revalidate=300');
});
