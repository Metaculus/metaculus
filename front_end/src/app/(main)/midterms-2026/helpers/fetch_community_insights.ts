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
    // and cap each question's contribution for diversity.
    const perPost = await Promise.all(
      posts.map(async (sourcePost) => {
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
            .slice(0, MAX_PER_POST)
            .map((comment) => ({
              type: "top-comment" as const,
              comment,
              sourcePost,
            }));
        } catch {
          return [];
        }
      })
    );

    // Rank globally by votes, then substance (prose length), then recency.
    return perPost
      .flat()
      .map((insight) => ({
        insight,
        votes: insight.comment.vote_score ?? 0,
        len: proseLength(insight.comment.text ?? ""),
        time: insight.comment.created_at
          ? Date.parse(insight.comment.created_at)
          : 0,
      }))
      .sort((a, b) => b.votes - a.votes || b.len - a.len || b.time - a.time)
      .slice(0, MAX_INSIGHTS)
      .map((r) => r.insight);
  }
);
