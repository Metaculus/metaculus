import { cache } from "react";

import { buildCommentUrl } from "./build_comment_url";
import { type CuratedInsight, JOBS_DATA } from "../../data";
import { CURATED_QUOTES } from "../curated_insights_data";

export type ResolvedInsight = CuratedInsight & {
  source: "curated";
  author?: string;
  commentId?: number;
  onPostId?: number;
  commentUrl?: string;
};

/**
 * Resolves a job's Curated Insights: the hand-picked pro-forecaster excerpts
 * (from curated_insights_data), shown verbatim. The commentId only powers the
 * "open original comment" link.
 */
function resolveInsights(slug: string): ResolvedInsight[] {
  const job = JOBS_DATA.find((j) => j.slug === slug);
  if (!job) return [];

  return (CURATED_QUOTES[slug] ?? []).map((quote) => ({
    type: "neutral",
    body: quote.body,
    source: "curated",
    author: quote.author,
    commentId: quote.commentId,
    onPostId: job.post_id,
    commentUrl: buildCommentUrl(job.post_id, quote.commentId),
  }));
}

export const fetchJobInsights = cache(resolveInsights);
