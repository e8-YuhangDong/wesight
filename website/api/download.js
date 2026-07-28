const latestReleaseApiUrl =
  'https://api.github.com/repos/freestylefly/wesight/releases/latest';
const releasesUrl = 'https://github.com/freestylefly/wesight/releases/latest';

const architecturePatterns = {
  arm64: /[._-]mac[._-](arm64|aarch64)\.dmg$/i,
  x64: /[._-]mac[._-](x64|x86_64|amd64)\.dmg$/i,
};

function selectInstaller(assets, architecture) {
  const pattern = architecturePatterns[architecture];

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
  const architecture = Array.isArray(request.query?.arch)
    ? request.query.arch[0]
    : request.query?.arch;

  if (!architecturePatterns[architecture]) {
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
    const installer = selectInstaller(release.assets, architecture);

    if (!installer) {
      console.warn(
        `[WebsiteDownload] No ${architecture} DMG was found in the latest release.`,
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
