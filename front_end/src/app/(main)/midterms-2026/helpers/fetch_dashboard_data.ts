import "server-only";
import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostWithForecasts } from "@/types/post";

import { CHAMBER_QUESTIONS, SENATE_RACES } from "../data";
import { SenateRaceWithPost } from "./post_utils";

export const fetchSenateRaces = cache(
  async (): Promise<SenateRaceWithPost[]> => {
    const ids = SENATE_RACES.map((r) => r.postId).filter((id) => id > 0);
    if (!ids.length) {
      return SENATE_RACES.map((r) => ({ ...r, post: null }));
    }

    const { results } = await ServerPostsApi.getPostsWithCP({
      ids,
      limit: ids.length,
    });

    const byId = new Map(results.map((p) => [p.id, p]));
    return SENATE_RACES.map((r) => ({
      ...r,
      post: byId.get(r.postId) ?? null,
    }));
  }
);

export type ChamberData = {
  senateControl: PostWithForecasts | null;
  houseControl: PostWithForecasts | null;
  congressOutcomeGroup: PostWithForecasts | null;
  voterTurnout: PostWithForecasts | null;
  electionIntegrity: PostWithForecasts | null;
};

export const fetchChamberData = cache(async (): Promise<ChamberData> => {
  const ids = Object.values(CHAMBER_QUESTIONS).filter((id) => id > 0);
  if (!ids.length) {
    return {
      senateControl: null,
      houseControl: null,
      congressOutcomeGroup: null,
      voterTurnout: null,
      electionIntegrity: null,
    };
  }

  const { results } = await ServerPostsApi.getPostsWithCP({
    ids,
    limit: ids.length,
  });
  const byId = new Map(results.map((p) => [p.id, p]));

  return {
    senateControl: byId.get(CHAMBER_QUESTIONS.senateControl) ?? null,
    houseControl: byId.get(CHAMBER_QUESTIONS.houseControl) ?? null,
    congressOutcomeGroup:
      byId.get(CHAMBER_QUESTIONS.congressOutcomeGroup) ?? null,
    voterTurnout: byId.get(CHAMBER_QUESTIONS.voterTurnout) ?? null,
    electionIntegrity: byId.get(CHAMBER_QUESTIONS.electionIntegrity) ?? null,
  };
});
