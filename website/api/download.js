const latestReleaseApiUrl = 'https://api.github.com/repos/freestylefly/wesight/releases/latest';
const releasesUrl = 'https://github.com/freestylefly/wesight/releases/latest';

const installerTargets = {
  macArm64: {
    description: 'macOS arm64 DMG',
    pattern: /[._-]mac[._-](arm64|aarch64)\.dmg$/i,
  },
  macX64: {
    description: 'macOS x64 DMG',
    pattern: /[._-]mac[._-](x64|x86_64|amd64)\.dmg$/i,
  },
  windowsX64: {
    description: 'Windows x64 installer',
    pattern: /^WeSight\.Setup\.\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\.exe$/i,
  },
};

function readQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveInstallerTarget(query = {}) {
  const platform = readQueryValue(query.platform);
  const architecture = readQueryValue(query.arch);

  if (platform === 'windows') {
    return !architecture || architecture === 'x64' ? 'windowsX64' : null;
  }

  if (platform && platform !== 'mac' && platform !== 'macos') {
    return null;
  }

  if (architecture === 'arm64') {
    return 'macArm64';
  }

  if (architecture === 'x64') {
    return 'macX64';
  }

  return null;
}

export function selectInstaller(assets, target) {
  const pattern = installerTargets[target]?.pattern;

  if (!pattern || !Array.isArray(assets)) {
    return null;
  }

  return (
    assets.find(
      asset =>
        typeof asset?.name === 'string' &&
        pattern.test(asset.name) &&
        typeof asset?.browser_download_url === 'string' &&
        asset.browser_download_url.startsWith(
          'https://github.com/freestylefly/wesight/releases/download/',
        ),
    ) ?? null
  );
}

function redirect(response, location) {
  response.statusCode = 302;
  response.setHeader('Location', location);
  response.end();
}

export default async function handler(request, response) {
  const target = resolveInstallerTarget(request.query);

  if (!target) {
    redirect(response, releasesUrl);
    return;
  }

  response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=300');

  try {
    const headers = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'wesight-download-redirect',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const releaseResponse = await fetch(latestReleaseApiUrl, { headers });

    if (!releaseResponse.ok) {
      console.warn(
        `[WebsiteDownload] GitHub release lookup returned HTTP ${releaseResponse.status}.`,
      );
      redirect(response, releasesUrl);
      return;
    }

    const release = await releaseResponse.json();
    const installer = selectInstaller(release.assets, target);

    if (!installer) {
      console.warn(
        `[WebsiteDownload] No ${installerTargets[target].description} was found in the latest release.`,
      );
      redirect(response, releasesUrl);
      return;
    }

    redirect(response, installer.browser_download_url);
  } catch (error) {
    console.error('[WebsiteDownload] GitHub release lookup failed:', error);
    redirect(response, releasesUrl);
  }
}
