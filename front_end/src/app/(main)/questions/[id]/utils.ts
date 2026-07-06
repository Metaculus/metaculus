export function getProxiedFaviconUrl(originalUrl: string): string {
  if (!originalUrl) return "";
  return `/newsmatch/favicon?url=${encodeURIComponent(originalUrl)}`;
}
