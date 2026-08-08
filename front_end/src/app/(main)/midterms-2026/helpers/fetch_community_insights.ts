import "server-only";
import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { stripMarkdown } from "@/utils/markdown";

import { MIDTERMS_PROJECT_ID } from "../data";
import { fetchChamberData, fetchSenateRaces } from "./fetch_dashboard_data";

export type TopCommentInsight = {
  type: "top-comment";
  comment: CommentType;
  sourcePost: PostWithForecasts;
};

export type CommunityInsight = TopCommentInsight;

// Quality-bar tuning.
const COMMENTS_PER_POST = 10; // candidates pulled per question
const MIN_PROSE_LENGTH = 100; // chars of real prose after stripping links
const MAX_PER_POST = 3; // diversity cap in the final list
const MAX_INSIGHTS = 30; // overall safety cap
// Cap how many comment requests fire at once so the whole project's questions
// don't flood the backend in one burst (the dashboard already runs many
// parallel SSR fetches; an unbounded fan-out here can saturate it).
const FETCH_CONCURRENCY = 4;

// Map over items with bounded concurrency (sequential batches of `limit`).
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    out.push(...(await Promise.all(items.slice(i, i + limit).map(fn))));
  }
  return out;
}

// Comments that @-mention a moderator/admin or ask about question mechanics are
// housekeeping, not forecasting insight. Patterns are phrase-anchored so that
// analysis prose merely using the word "resolve"/"resolution" isn't caught.
const META_PATTERNS = [
  /@\(?(admin|moderators?|mods?)\)?/i,
  /how (will|would|does)\b[^.?!]*\bresolve\b/i,
  /should(n'?t)? this question\b/i,
  /\bbackground info\b/i,
];

// Real prose left after removing markdown link syntax and bare URLs — used to
// reject bare links and one-liners.
function proseLength(text: string): number {
  return stripMarkdown(text ?? "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

// Order comments by votes, then substance (prose length), then recency. Used
// both within a question and across the final list, so the per-question cap
// keeps each question's *best* comments rather than an arbitrary vote-tie order.
function compareComments(a: CommentType, b: CommentType): number {
  return (
    (b.vote_score ?? 0) - (a.vote_score ?? 0) ||
    proseLength(b.text) - proseLength(a.text) ||
    (b.created_at ? Date.parse(b.created_at) : 0) -
      (a.created_at ? Date.parse(a.created_at) : 0)
  );
}

// A comment is dropped if it's downvoted, authored/aimed at staff, a
// resolution/admin housekeeping note, or just a link / one-liner.
function isLowQuality(comment: CommentType): boolean {
  if ((comment.vote_score ?? 0) < 0) return true;
  if (comment.author?.is_staff) return true;
  if (comment.mentioned_users?.some((u) => u.is_staff)) return true;
  const text = comment.text ?? "";
  if (META_PATTERNS.some((re) => re.test(text))) return true;
  if (proseLength(text) < MIN_PROSE_LENGTH) return true;
  return false;
}

// Every question in the midterms project. Falls back to the core dashboard
// posts if the project listing fails, so the section still renders.
async function fetchProjectPosts(): Promise<PostWithForecasts[]> {
  try {
    const { results } = await ServerPostsApi.getPosts({
      tournaments: [String(MIDTERMS_PROJECT_ID)],
      statuses: ["open", "closed", "resolved", "upcoming"],
      limit: 100,
    });
    if (results?.length) return results;
  } catch {
    // fall through to the dashboard posts below
  }

  const [{ parentPost }, chamber] = await Promise.all([
    fetchSenateRaces(),
    fetchChamberData(),
  ]);
  return [
    parentPost,
    chamber.senateControl,
    chamber.houseControl,
    chamber.congressOutcome,
    chamber.electionEmergency,
    chamber.abortionAmendment,
  ].filter((p): p is PostWithForecasts => p !== null);
}

export const fetchCommunityInsights = cache(
  async (): Promise<CommunityInsight[]> => {
    const posts = await fetchProjectPosts();
    if (!posts.length) return [];

    // Pull the top candidates per question, keep only the substantive ones,
    // and cap each question's contribution for diversity. Bounded concurrency
    // keeps the per-question fan-out from saturating the backend.
    const perPost = await mapWithConcurrency(
      posts,
      FETCH_CONCURRENCY,
      async (sourcePost) => {
        try {
          const { results } = await ServerCommentsApi.getComments({
            post: sourcePost.id,
            sort: "-vote_score",
            limit: COMMENTS_PER_POST,
            parent_isnull: true,
            exclude_bots: true,
          });
          return (results ?? [])
            .filter((comment) => !isLowQuality(comment))
            .sort(compareComments)
            .slice(0, MAX_PER_POST)
            .map((comment) => ({
              type: "top-comment" as const,
              comment,
              sourcePost,
            }));
        } catch {
          return [];
        }
      }
    );

    // Rank the whole list by the same comparator and cap it.
    return perPost
      .flat()
      .sort((a, b) => compareComments(a.comment, b.comment))
      .slice(0, MAX_INSIGHTS);
  }
);
