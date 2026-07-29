import { getManualUpdateCheckUrl, getUpdateCheckUrl } from './endpoints';

export const UPDATE_POLL_INTERVAL_MS = 12 * 60 * 60 * 1000;
export const UPDATE_HEARTBEAT_INTERVAL_MS = 30 * 60 * 1000;

type ChangeLogLang = {
  title?: string;
  content?: string[];
};

type PlatformDownload = {
  url?: string;
};

type UpdateApiResponse = {
  code?: number;
  data?: {
    value?: {
      version?: string;
      date?: string;
      changeLog?: {
        ch?: ChangeLogLang;
        en?: ChangeLogLang;
      };
      macIntel?: PlatformDownload;
      macArm?: PlatformDownload;
      windowsX64?: PlatformDownload;
    };
  };
};

type GitHubReleaseAsset = {
  name?: string;
  browser_download_url?: string;
};

type GitHubReleaseResponse = {
  tag_name?: string;
  name?: string;
  body?: string;
  published_at?: string;
  assets?: GitHubReleaseAsset[];
};

export type ChangeLogEntry = {
  title: string;
  summary: string;
  content: string[];
};

export interface AppUpdateDownloadProgress {
  received: number;
  total: number | undefined;
  percent: number | undefined;
  speed: number | undefined;
}

export interface AppUpdateInfo {
  latestVersion: string;
  date: string;
  changeLog: { zh: ChangeLogEntry; en: ChangeLogEntry };
  url: string;
}

const WESIGHT_ASSET_NAME_PATTERN = /^wesight(?:[-_.\s]|$)/i;
const UPDATE_METADATA_ASSET_PATTERN = /(?:latest-mac\.yml|\.blockmap$|shasums?256|sha256|checksum)/i;

const hasDownloadUrl = (asset: GitHubReleaseAsset): asset is GitHubReleaseAsset & { browser_download_url: string } => (
  typeof asset.browser_download_url === 'string' && asset.browser_download_url.trim().length > 0
);

const isWeSightInstallerAsset = (asset: GitHubReleaseAsset): boolean => {
  const name = asset.name?.trim() || '';
  return hasDownloadUrl(asset)
    && WESIGHT_ASSET_NAME_PATTERN.test(name)
    && !UPDATE_METADATA_ASSET_PATTERN.test(name);
};

const toVersionParts = (version: string): number[] => (
  version
    .split('.')
    .map((part) => {
      const match = part.trim().match(/^\d+/);
      return match ? Number.parseInt(match[0], 10) : 0;
    })
);

const compareVersions = (a: string, b: string): number => {
  const aParts = toVersionParts(a);
  const bParts = toVersionParts(b);
  const maxLength = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < maxLength; i += 1) {
    const left = aParts[i] ?? 0;
    const right = bParts[i] ?? 0;
    if (left > right) return 1;
    if (left < right) return -1;
  }

  return 0;
};

const isNewerVersion = (latestVersion: string, currentVersion: string): boolean => (
  compareVersions(latestVersion, currentVersion) > 0
);

const stripInlineMarkdown = (value: string): string => (
  value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim()
);

const isGenericReleaseHeading = (value: string): boolean => (
  /^(?:what'?s changed|更新内容|更新日志)$/i.test(value.trim())
);

export const parseGitHubReleaseNotes = (
  body: string | undefined,
  fallbackTitle: string,
): ChangeLogEntry => {
  let title = fallbackTitle;
  let summary = '';
  const content: string[] = [];

  for (const rawLine of (body || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('>') || /^<!--/.test(line)) {
      continue;
    }

    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      const heading = stripInlineMarkdown(headingMatch[1]);
      if (!isGenericReleaseHeading(heading)) {
        title = heading.replace(/^WeSight\s+v?[\w.+-]+\s*[·:：-]\s*/i, '').trim() || title;
      }
      continue;
    }

    if (/^###\s+/.test(line)) {
      continue;
    }

    const listItemMatch = line.match(/^[-*]\s+(.+)$/);
    if (listItemMatch) {
      const item = stripInlineMarkdown(listItemMatch[1])
        .replace(/\s+by\s+@\S+.*$/i, '')
        .trim();
      if (item) {
        content.push(item);
      }
      continue;
    }

    if (
      /完整(?:代码)?差异|完整更新对比|full changelog/i.test(line) ||
      /^\[[^\]]+\]\(https:\/\/github\.com\/[^)]+\/compare\//i.test(line)
    ) {
      continue;
    }

    if (!summary) {
      summary = stripInlineMarkdown(line);
    }
  }

  return {
    title,
    summary,
    content: content.slice(0, 12),
  };
};

type UpdateValue = NonNullable<NonNullable<UpdateApiResponse['data']>['value']>;

const getPlatformDownloadUrl = (value: UpdateValue | undefined): string | null => {
  const { platform, arch } = window.electron;

  if (platform === 'darwin') {
    const download = arch === 'arm64' ? value?.macArm : value?.macIntel;
    return download?.url?.trim() || null;
  }

  if (platform === 'win32') {
    return value?.windowsX64?.url?.trim() || null;
  }

  return null;
};

const getGitHubDownloadUrl = (release: GitHubReleaseResponse): string | null => {
  const assets = (Array.isArray(release.assets) ? release.assets : [])
    .filter(isWeSightInstallerAsset);
  const { platform, arch } = window.electron;
  const matches = (asset: GitHubReleaseAsset, patterns: RegExp[]) => {
    const name = asset.name || '';
    return Boolean(asset.browser_download_url) && patterns.every((pattern) => pattern.test(name));
  };

  let asset: GitHubReleaseAsset | undefined;
  if (platform === 'darwin') {
    asset = assets.find((item) => (
      arch === 'arm64'
        ? matches(item, [/\.dmg$/i, /arm64|aarch64/i])
        : matches(item, [/\.dmg$/i]) && !/(arm64|aarch64)/i.test(item.name || '')
    ));
  } else if (platform === 'win32') {
    asset = assets.find((item) => matches(item, [/\.exe$/i]));
  } else {
    asset = assets.find((item) => matches(item, [/appimage|\.deb|\.rpm|\.tar\.gz$/i]));
  }

  return asset?.browser_download_url?.trim() || null;
};

const parseGitHubReleaseUpdate = (
  payload: GitHubReleaseResponse,
  currentVersion: string,
): AppUpdateInfo | null => {
  const latestVersion = payload.tag_name?.trim().replace(/^v/i, '') || '';
  if (!latestVersion || !isNewerVersion(latestVersion, currentVersion)) {
    console.log(`[AppUpdate] no update available, latestVersion=${latestVersion || 'N/A'}, currentVersion=${currentVersion}`);
    return null;
  }

  const fallbackTitle = payload.name?.trim() || payload.tag_name?.trim() || latestVersion;
  const date = payload.published_at?.slice(0, 10) || '';
  const entry = parseGitHubReleaseNotes(payload.body, fallbackTitle);
  const downloadUrl = getGitHubDownloadUrl(payload);
  if (!downloadUrl) {
    console.warn(`[AppUpdate] release ${latestVersion} has no valid WeSight installer for ${window.electron.platform}/${window.electron.arch}`);
    return null;
  }

  const result: AppUpdateInfo = {
    latestVersion,
    date,
    changeLog: { zh: entry, en: entry },
    url: downloadUrl,
  };
  console.log(`[AppUpdate] update available: ${currentVersion} -> ${latestVersion}, downloadUrl=${result.url}`);
  return result;
};

export const checkForAppUpdate = async (currentVersion: string, manual?: boolean): Promise<AppUpdateInfo | null> => {
  const url = manual ? getManualUpdateCheckUrl() : getUpdateCheckUrl();
  console.log(`[AppUpdate] checking update, currentVersion=${currentVersion}, url=${url}`);

  const response = await window.electron.api.fetch({
    url,
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    expectedStatuses: [404],
  });

  if (response.status === 404) {
    console.log('[AppUpdate] no release endpoint available, treating as no update');
    return null;
  }

  if (!response.ok || typeof response.data !== 'object' || response.data === null) {
    console.log(`[AppUpdate] request failed: status=${response.status}, statusText=${response.statusText}`);
    return null;
  }

  const maybeGitHubRelease = response.data as GitHubReleaseResponse;
  if (typeof maybeGitHubRelease.tag_name === 'string') {
    return parseGitHubReleaseUpdate(maybeGitHubRelease, currentVersion);
  }

  const payload = response.data as UpdateApiResponse;
  if (payload.code !== 0) {
    console.log(`[AppUpdate] server returned error code: ${payload.code}`);
    return null;
  }

  const value = payload.data?.value;
  const latestVersion = value?.version?.trim();
  if (!latestVersion || !isNewerVersion(latestVersion, currentVersion)) {
    console.log(`[AppUpdate] no update available, latestVersion=${latestVersion || 'N/A'}, currentVersion=${currentVersion}`);
    return null;
  }
  const downloadUrl = getPlatformDownloadUrl(value);
  if (!downloadUrl) {
    console.warn(`[AppUpdate] update ${latestVersion} has no valid installer for ${window.electron.platform}/${window.electron.arch}`);
    return null;
  }

  const toEntry = (log?: ChangeLogLang): ChangeLogEntry => ({
    title: typeof log?.title === 'string' ? log.title : '',
    summary: '',
    content: Array.isArray(log?.content) ? log.content : [],
  });

  const result: AppUpdateInfo = {
    latestVersion,
    date: value?.date?.trim() || '',
    changeLog: {
      zh: toEntry(value?.changeLog?.ch),
      en: toEntry(value?.changeLog?.en),
    },
    url: downloadUrl,
  };
  console.log(`[AppUpdate] update available: ${currentVersion} -> ${latestVersion}, downloadUrl=${result.url}`);
  return result;
};
