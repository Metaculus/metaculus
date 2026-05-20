import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import { logError } from "@/utils/core/errors";

import { buildCommentUrl } from "./build_comment_url";
import { type CuratedInsight, JOBS_DATA, type JobDefinition } from "../../data";

export type ResolvedInsight = CuratedInsight & {
  source: "curated" | "comment" | "keyword";
  author?: string;
  commentId?: number;
  onPostId?: number;
  commentUrl?: string;
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

function decodeEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripBody(text: string): string {
  let s = text;
  // Strip markdown images entirely: ![alt](url)
  s = s.replace(/!\[[^\]]*?\]\([^)]+?\)/g, "");
  // Markdown link [label](url) → label
  s = s.replace(/\[([^\]]+?)\]\([^)]+?\)/g, "$1");
  // Drop backslash escapes (e.g. \[occupation\])
  s = s.replace(/\\([[\]()*_`#])/g, "$1");
  // Drop entire markdown table rows (any line with 2+ pipes)
  s = s.replace(/^.*\|.*\|.*$/gm, "");
  // Drop horizontal rules / table separators (lines that are only dashes / =/ * and whitespace)
  s = s.replace(/^[\s\-=*]{3,}$/gm, "");
  // Strip emphasis / code / heading markers
  s = s.replace(/[*_`#]+/g, "");
  // Drop blockquote and bullet prefixes at start of line
  s = s.replace(/^\s*[>*\-+]\s*/gm, "");
  // Strip HTML tags (e.g. <p>, <strong>)
  s = s.replace(/<\/?[^>]+>/g, "");
  // Decode HTML entities
  s = decodeEntities(s);
  // Take the first non-empty paragraph after the above cleanup
  const paragraphs = s
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const firstPara = paragraphs[0] ?? "";
  // Collapse internal whitespace
  return firstPara.replace(/\s+/g, " ").trim();
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

async function fetchTopComments(
  postId: number,
  excludedIds: Set<number>
): Promise<ResolvedInsight[]> {
  try {
    const response = await ServerCommentsApi.getComments({
      post: postId,
      sort: "-vote_score",
      exclude_bots: true,
      limit: 20,
      parent_isnull: true,
    });
    return response.results
      .filter((c) => !c.is_soft_deleted && !excludedIds.has(c.id))
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
          commentUrl: buildCommentUrl(comment.on_post, comment.id),
        })
      );
  } catch (err) {
    logError(err);
    return [];
  }
}

async function resolveInsights(slug: string): Promise<ResolvedInsight[]> {
  const job = JOBS_DATA.find((j) => j.slug === slug);
  if (!job) return [];

  const excluded = new Set(job.excluded_comment_ids ?? []);

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
  const own = await fetchTopComments(job.post_id, excluded);
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
    const sibling = await fetchTopComments(postId, excluded);
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

export const fetchJobInsights = cache(resolveInsights);
