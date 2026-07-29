const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

export const resolvePublicAssetUrl = (
  assetPath: string,
  baseUrl = typeof document === 'undefined'
    ? import.meta.env.BASE_URL
    : document.baseURI,
): string => {
  const normalizedAssetPath = assetPath.replace(/^\/+/, '');
  try {
    return new URL(normalizedAssetPath, baseUrl).href;
  } catch {
    return `${normalizeBaseUrl(baseUrl)}${normalizedAssetPath}`;
  }
};
