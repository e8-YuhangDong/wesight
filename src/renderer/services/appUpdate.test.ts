import { beforeEach, expect, test, vi } from 'vitest';

import { checkForAppUpdate } from './appUpdate';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('window', {
    electron: {
      platform: 'win32',
      arch: 'x64',
      api: {
        fetch: vi.fn(),
      },
    },
  });
});

test('checkForAppUpdate treats missing GitHub latest release as no update', async () => {
  const fetchMock = window.electron.api.fetch as ReturnType<typeof vi.fn>;
  fetchMock.mockResolvedValue({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    headers: {},
    data: { message: 'Not Found' },
  });

  await expect(checkForAppUpdate('2026.6.1-preview.1')).resolves.toBeNull();
  expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({
    expectedStatuses: [404],
  }));
});

test('checkForAppUpdate selects the WeSight macOS asset for the current architecture', async () => {
  vi.stubGlobal('window', {
    electron: {
      platform: 'darwin',
      arch: 'arm64',
      api: {
        fetch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {
            tag_name: 'v2026.6.2',
            name: 'WeSight 2026.6.2',
            published_at: '2026-06-02T00:00:00Z',
            body: 'Release notes',
            assets: [
              {
                name: 'Youdao-Claw-2026.6.2-arm64.dmg',
                browser_download_url: 'https://example.com/youdao-claw.dmg',
              },
              {
                name: 'latest-mac.yml',
                browser_download_url: 'https://example.com/latest-mac.yml',
              },
              {
                name: 'WeSight-2026.6.2-arm64.dmg',
                browser_download_url: 'https://example.com/wesight-arm64.dmg',
              },
            ],
          },
        }),
      },
    },
  });

  await expect(checkForAppUpdate('2026.6.1')).resolves.toMatchObject({
    latestVersion: '2026.6.2',
    url: 'https://example.com/wesight-arm64.dmg',
  });
});

test('checkForAppUpdate ignores releases without a WeSight installer asset', async () => {
  vi.stubGlobal('window', {
    electron: {
      platform: 'darwin',
      arch: 'arm64',
      api: {
        fetch: vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: {},
          data: {
            tag_name: 'v2026.6.2',
            name: 'WeSight 2026.6.2',
            assets: [
              {
                name: 'Youdao-Claw-2026.6.2-arm64.dmg',
                browser_download_url: 'https://example.com/youdao-claw.dmg',
              },
              {
                name: 'WeSight-2026.6.2-arm64.dmg.blockmap',
                browser_download_url: 'https://example.com/wesight-arm64.dmg.blockmap',
              },
            ],
          },
        }),
      },
    },
  });

  await expect(checkForAppUpdate('2026.6.1')).resolves.toBeNull();
});

test('checkForAppUpdate converts Chinese GitHub Markdown into clean client release notes', async () => {
  const fetchMock = window.electron.api.fetch as ReturnType<typeof vi.fn>;
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {},
    data: {
      tag_name: 'v1.0.4',
      name: 'v1.0.4',
      published_at: '2026-07-30T00:00:00Z',
      body: [
        '> [!WARNING]',
        '> Windows x64 安装包当前尚未签名。',
        '',
        '## WeSight v1.0.4 · 更新体验优化',
        '',
        '本次更新让版本信息更清晰。',
        '',
        '### 优化',
        '',
        '- 官网、GitHub Release 与客户端统一使用中文更新日志',
        '- 清理客户端中的 Markdown 标记',
        '',
        '[查看 v1.0.4 的完整代码差异](https://github.com/freestylefly/wesight/compare/v1.0.3...v1.0.4)',
      ].join('\n'),
      assets: [
        {
          name: 'WeSight.Setup.1.0.4.exe',
          browser_download_url: 'https://example.com/WeSight.Setup.1.0.4.exe',
        },
      ],
    },
  });

  await expect(checkForAppUpdate('1.0.3')).resolves.toMatchObject({
    latestVersion: '1.0.4',
    changeLog: {
      zh: {
        title: '更新体验优化',
        summary: '本次更新让版本信息更清晰。',
        content: [
          '官网、GitHub Release 与客户端统一使用中文更新日志',
          '清理客户端中的 Markdown 标记',
        ],
      },
      en: {
        title: '更新体验优化',
        summary: '本次更新让版本信息更清晰。',
      },
    },
  });
});
