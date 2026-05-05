import "server-only";
import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import { CommentType, KeyFactor } from "@/types/comment";

import { fetchSenateRaces } from "./fetch_dashboard_data";
import { SenateRaceWithPost } from "./post_utils";

export type KeyFactorInsight = {
  type: "key-factor";
  keyFactor: KeyFactor;
  race: SenateRaceWithPost;
};

export type TopCommentInsight = {
  type: "top-comment";
  comment: CommentType;
  race: SenateRaceWithPost;
};

export type CommunityInsight = KeyFactorInsight | TopCommentInsight;

const MAX_KEY_FACTORS = 4;
const MAX_TOP_COMMENTS = 4;

export const fetchCommunityInsights = cache(
  async (): Promise<CommunityInsight[]> => {
    const races = await fetchSenateRaces();
    const racesWithPosts = races.filter((r) => r.post);

    if (!racesWithPosts.length) return [];

    const keyFactorCards: KeyFactorInsight[] = racesWithPosts
      .flatMap((race) =>
        (race.post?.key_factors ?? []).map((kf) => ({
          type: "key-factor" as const,
          keyFactor: kf,
          race,
        }))
      )
      .sort((a, b) => b.keyFactor.vote.score - a.keyFactor.vote.score)
      .slice(0, MAX_KEY_FACTORS);

    const topCommentResults = await Promise.all(
      racesWithPosts.map(async (race) => {
        try {
          const { results } = await ServerCommentsApi.getComments({
            post: race.postId,
            sort: "-vote_score",
            limit: 1,
            parent_isnull: true,
          });
          const comment = results[0];
          if (!comment) return null;
          return { type: "top-comment" as const, comment, race };
        } catch {
          return null;
        }
      })
    );

    const topCommentCards: TopCommentInsight[] = topCommentResults
      .filter((c): c is TopCommentInsight => c !== null)
      .sort((a, b) => (b.comment.vote_score ?? 0) - (a.comment.vote_score ?? 0))
      .slice(0, MAX_TOP_COMMENTS);

    return interleave<CommunityInsight>(keyFactorCards, topCommentCards);
  }
);

function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) out.push(a[i] as T);
    if (i < b.length) out.push(b[i] as T);
  }
  return out;
}
