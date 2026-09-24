import "server-only";
import { Metadata } from "next";

import { Post } from "@/types/post";
import { BotLeaderboardStatus, Tournament } from "@/types/projects";
import { getValidString } from "@/utils/formatters/string";
import { getPostLink } from "@/utils/navigation";
import { getPublicSettings } from "@/utils/public_settings.server";

// getPostLink's parameter already carries id/slug/projects/notebook; this adds
// the SEO metadata and the one project field getPostLink itself doesn't read.
type SeoPost = Parameters<typeof getPostLink>[0] &
  Pick<Post, "html_metadata_json"> & {
    projects?: {
      default_project?: Pick<Tournament, "bot_leaderboard_status"> | null;
    } | null;
  };

/**
 * Bot-only posts duplicate their human counterparts, which lets Google pick the
 * bot version as canonical. Keyed off default_project to match how bot-only
 * posts are identified elsewhere (see comments/services/feed.py).
 */
function isBotsOnlyPost(post: SeoPost) {
  return (
    post.projects?.default_project?.bot_leaderboard_status ===
    BotLeaderboardStatus.BotsOnly
  );
}

/**
 * Single source of truth for "should Google index this URL?".
 *
 * The sitemap and the page's own robots/canonical tags MUST agree — a sitemap
 * entry for a noindex page is a Search Console error, so both derive from here.
 */
export function isIndexablePost(post: SeoPost) {
  // An explicit canonical points somewhere else; that target belongs in the
  // sitemap instead of this post.
  if (getValidString(post.html_metadata_json?.canonical_url)) {
    return false;
  }

  return !isBotsOnlyPost(post);
}

/**
 * A canonical pointing at another URL combined with noindex is contradictory:
 * Google may apply the noindex to the canonical target, deindexing the very
 * page we're pointing at. So an explicit override always suppresses the
 * bot-only noindex — never emit both.
 *
 * Without an override the canonical is self-referencing: any slug resolves
 * under the /questions/[id]/[[...slug]] catch-all, so each variant would
 * otherwise be a separate indexable URL for the same post.
 */
export function getPostSeoMetadata(post: SeoPost): Metadata {
  const canonicalOverride = getValidString(
    post.html_metadata_json?.canonical_url
  );
  if (canonicalOverride) {
    return { alternates: { canonical: canonicalOverride } };
  }

  const { PUBLIC_APP_URL } = getPublicSettings();
  const metadata: Metadata = {
    alternates: { canonical: `${PUBLIC_APP_URL}${getPostLink(post)}` },
  };

  if (isBotsOnlyPost(post)) {
    metadata.robots = { index: false, follow: true };
  }

  return metadata;
}
