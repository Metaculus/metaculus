// Paths (after /api-proxy) requested by the Client*Api services; slugs match Django's slug converter
const ALLOWED_PATHS: RegExp[] = [
  /^\/ad-tiles\/$/,
  /^\/aggregation_explorer\/$/,
  /^\/coherence\/question\/\d+\/(links|aggregate-links)\/$/,
  /^\/comments\/$/,
  /^\/comments\/\d+\/$/,
  /^\/comments\/\d+\/suggested-key-factors\/$/,
  /^\/comments\/comments-of-week\/$/,
  /^\/data\/download\/$/,
  /^\/get-bulletins\/$/,
  /^\/posts\/$/,
  /^\/posts\/(onboarding-feed|private-notes|random)\/$/,
  /^\/posts\/\d+\/$/,
  /^\/posts\/\d+\/(news-hotness|related-articles|similar-posts)\/$/,
  /^\/projects\/(communities|site_main|tournaments)\/$/,
  /^\/projects\/tournaments\/[-a-zA-Z0-9_]+\/forecast-flow-posts\/$/,
  /^\/questions\/\d+\/$/,
  /^\/users\/$/,
];

export function isApiProxyPathAllowed(path: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}
