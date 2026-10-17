import { MetadataRoute } from "next";

import { JOBS_DATA } from "@/app/(main)/labor-hub/data";
import ServerMiscApi from "@/services/api/misc/misc.server";
import { getPostLink, getProjectLink } from "@/utils/navigation";
import { getPublicSettings } from "@/utils/public_settings.server";
import { isIndexablePost } from "@/utils/questions/metadata";

export const revalidate = 3600;

/**
 * Evergreen static pages, curated by hand rather than globbed from the app
 * router: the filesystem can't tell an indexable content page from a dev/test
 * route (charts, sentry-debug, auth-test) or an auth-gated one. New content
 * pages are rare, so a correct short list beats an auto-list full of junk.
 *
 * Each has been checked to render a 200 without params or auth. Deliberately
 * excluded: /medals/ and /contributions/ (conditional redirects), campaign
 * landings like /aib/* (time-bound). "/" is handled separately below since it
 * only renders when PUBLIC_LANDING_PAGE_URL is "/".
 */
const STATIC_PATHS = [
  "/questions/",
  "/news/",
  "/leaderboard/",
  "/about/",
  "/faq/",
  "/how-to-forecast/",
  "/why/",
  "/press/",
  "/services/",
  "/question-writing/",
  "/tournament-rules/",
  "/privacy-policy/",
  "/terms-of-use/",
  "/help/guidelines/",
  "/help/markdown/",
  "/help/medals-faq/",
  "/help/scores-faq/",
  "/help/prediction-resources/",
  "/help/question-checklist/",
  "/labor-hub/",
  "/labor-hub/jobs/",
];

/**
 * next.config.mjs sets trailingSlash: true, so a URL without one is a redirect.
 * getProjectLink omits it for tournaments; a sitemap must list final URLs only.
 */
function absoluteUrl(appUrl: string, path: string) {
  return `${appUrl}${path.endsWith("/") ? path : `${path}/`}`;
}

/**
 * Emits a single /sitemap.xml. Google's limit is 50k URLs (or 50MB) per file
 * and we're well under it — once we approach that, this has to split via
 * generateSitemaps(), which serves /sitemap/[id].xml and does NOT produce a
 * sitemap index, so the index would have to be written by hand.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { PUBLIC_APP_URL, PUBLIC_DISALLOW_ALL_BOTS, PUBLIC_LANDING_PAGE_URL } =
    getPublicSettings();
  if (PUBLIC_DISALLOW_ALL_BOTS) {
    return [];
  }

  const { posts, projects } = await ServerMiscApi.getSitemap();

  // "/" only renders the homepage when it isn't configured to redirect
  // elsewhere; otherwise the target itself is a static path below.
  const rootPaths = PUBLIC_LANDING_PAGE_URL === "/" ? ["/"] : [];

  // Derived from JOBS_DATA so the sitemap tracks the job set that drives the
  // /labor-hub/jobs/[slug] pages.
  const laborHubJobPaths = JOBS_DATA.map(
    (job) => `/labor-hub/jobs/${job.slug}/`
  );

  return [
    ...[...rootPaths, ...STATIC_PATHS, ...laborHubJobPaths].map((path) => ({
      url: absoluteUrl(PUBLIC_APP_URL, path),
    })),
    ...projects.map((project) => ({
      url: absoluteUrl(PUBLIC_APP_URL, getProjectLink(project)),
      ...(project.lastmod ? { lastModified: new Date(project.lastmod) } : {}),
    })),
    // Same builder the page's rel=canonical uses, so the two cannot disagree.
    ...posts.filter(isIndexablePost).map((post) => ({
      url: absoluteUrl(PUBLIC_APP_URL, getPostLink(post)),
      ...(post.lastmod ? { lastModified: new Date(post.lastmod) } : {}),
    })),
  ];
}
