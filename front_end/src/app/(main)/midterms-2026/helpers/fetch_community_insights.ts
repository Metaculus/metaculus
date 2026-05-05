import "server-only";
import { cache } from "react";

import ServerCommentsApi from "@/services/api/comments/comments.server";
import { CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

import { fetchChamberData, fetchSenateRaces } from "./fetch_dashboard_data";

export type TopCommentInsight = {
  type: "top-comment";
  comment: CommentType;
  sourcePost: PostWithForecasts;
};

export type CommunityInsight = TopCommentInsight;

const MAX_TOP_COMMENTS = 8;

export const fetchCommunityInsights = cache(
  async (): Promise<CommunityInsight[]> => {
    const [{ parentPost: senateParent }, chamber] = await Promise.all([
      fetchSenateRaces(),
      fetchChamberData(),
    ]);

    const sourcePosts: PostWithForecasts[] = [
      senateParent,
      chamber.senateControl,
      chamber.houseControl,
      chamber.congressOutcome,
      chamber.voterTurnout,
      chamber.electionIntegrity,
    ].filter((p): p is PostWithForecasts => p !== null);

    if (!sourcePosts.length) return [];

    const topCommentResults = await Promise.all(
      sourcePosts.map(async (post) => {
        try {
          const { results } = await ServerCommentsApi.getComments({
            post: post.id,
            sort: "-vote_score",
            limit: 1,
            parent_isnull: true,
          });
          const comment = results[0];
          if (!comment) return null;
          return { type: "top-comment" as const, comment, sourcePost: post };
        } catch {
          return null;
        }
      })
    );

    return topCommentResults
      .filter((c): c is TopCommentInsight => c !== null)
      .sort((a, b) => (b.comment.vote_score ?? 0) - (a.comment.vote_score ?? 0))
      .slice(0, MAX_TOP_COMMENTS);
  }
);
