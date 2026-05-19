import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import { logError } from "@/utils/core/errors";

import { type CuratedInsight, JOBS_DATA, type JobDefinition } from "../../data";

export type ResolvedInsight = CuratedInsight & {
  source: "curated" | "comment" | "keyword";
  author?: string;
  commentId?: number;
  onPostId?: number;
};

const TARGET_INSIGHT_COUNT = 4;
const MIN_BODY_LENGTH = 80;
const MAX_BODY_LENGTH = 320;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}

function stripBody(text: string): string {
  // Take the first paragraph, strip markdown markers we don't need on the card.
  const firstPara = text.split(/\n\s*\n/)[0] ?? text;
  return firstPara
    .replace(/^\s*[>*-]\s*/g, "")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/[*_`]+/g, "")
    .trim();
}

function commentMatchesKeywords(
  text: string,
  job: Pick<JobDefinition, "name" | "keyword_aliases">
): boolean {
  const lower = text.toLowerCase();
  if (lower.includes(job.name.toLowerCase())) return true;
  for (const alias of job.keyword_aliases ?? []) {
    if (lower.includes(alias.toLowerCase())) return true;
  }
  return false;
}

async function fetchTopComments(postId: number): Promise<ResolvedInsight[]> {
  try {
    const response = await ServerCommentsApi.getComments({
      post: postId,
      sort: "-vote_score",
      exclude_bots: true,
      limit: 20,
      parent_isnull: true,
    });
    return response.results
      .filter((c) => !c.is_soft_deleted)
      .map((c) => ({
        comment: c,
        body: truncate(stripBody(c.text), MAX_BODY_LENGTH),
      }))
      .filter(({ body }) => body.length >= MIN_BODY_LENGTH)
      .map(
        ({ comment, body }): ResolvedInsight => ({
          type: "neutral",
          body,
          source: "comment",
          author: comment.author.username,
          commentId: comment.id,
          onPostId: comment.on_post,
        })
      );
  } catch (err) {
    logError(err);
    return [];
  }
}

export const fetchJobInsights = cache(
  async (slug: string): Promise<ResolvedInsight[]> => {
    const job = JOBS_DATA.find((j) => j.slug === slug);
    if (!job) return [];

    const curated: ResolvedInsight[] = (job.curated_insights ?? []).map(
      (insight) => ({
        ...insight,
        source: "curated",
      })
    );
    if (curated.length >= TARGET_INSIGHT_COUNT) {
      return curated.slice(0, TARGET_INSIGHT_COUNT);
    }

    // Tier 2: top comments on the job's own post.
    const own = await fetchTopComments(job.post_id);
    const merged: ResolvedInsight[] = [...curated, ...own];
    if (merged.length >= TARGET_INSIGHT_COUNT) {
      return merged.slice(0, TARGET_INSIGHT_COUNT);
    }

    // Tier 3: keyword-matched comments from sibling Labor Hub posts.
    const siblingIds = JOBS_DATA.filter((j) => j.post_id !== job.post_id).map(
      (j) => j.post_id
    );
    const seen = new Set(
      merged.map((insight) => insight.commentId).filter(Boolean)
    );
    for (const postId of siblingIds) {
      if (merged.length >= TARGET_INSIGHT_COUNT) break;
      const sibling = await fetchTopComments(postId);
      for (const insight of sibling) {
        if (merged.length >= TARGET_INSIGHT_COUNT) break;
        if (insight.commentId && seen.has(insight.commentId)) continue;
        if (!commentMatchesKeywords(insight.body, job)) continue;
        merged.push({ ...insight, source: "keyword" });
        if (insight.commentId) seen.add(insight.commentId);
      }
    }

    return merged;
  }
);
