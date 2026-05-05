import "server-only";
import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";

import { CHAMBER_QUESTIONS, SENATE_GROUP_POST_ID, SENATE_RACES } from "../data";
import { SenateRaceWithQuestion } from "./post_utils";

export const fetchSenateRaces = cache(
  async (): Promise<{
    races: SenateRaceWithQuestion[];
    parentPost: PostWithForecasts | null;
  }> => {
    if (!SENATE_GROUP_POST_ID) {
      return {
        races: SENATE_RACES.map((r) => ({
          ...r,
          parentPost: null,
          question: null,
        })),
        parentPost: null,
      };
    }

    let parentPost: PostWithForecasts | null = null;
    try {
      parentPost = await ServerPostsApi.getPost(SENATE_GROUP_POST_ID, true);
    } catch {
      parentPost = null;
    }

    const subQuestions =
      (parentPost?.group_of_questions?.questions as
        | QuestionWithNumericForecasts[]
        | undefined) ?? [];
    const byLabel = new Map(subQuestions.map((q) => [q.label, q]));

    const races: SenateRaceWithQuestion[] = SENATE_RACES.map((r) => ({
      ...r,
      parentPost,
      question: byLabel.get(r.subQuestionLabel) ?? null,
    }));

    return { races, parentPost };
  }
);

export type ChamberData = {
  senateControl: PostWithForecasts | null;
  houseControl: PostWithForecasts | null;
  congressOutcome: PostWithForecasts | null;
  voterTurnout: PostWithForecasts | null;
  electionIntegrity: PostWithForecasts | null;
};

export const fetchChamberData = cache(async (): Promise<ChamberData> => {
  const ids = Object.values(CHAMBER_QUESTIONS).filter((id) => id > 0);
  if (!ids.length) {
    return {
      senateControl: null,
      houseControl: null,
      congressOutcome: null,
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
    congressOutcome: byId.get(CHAMBER_QUESTIONS.congressOutcome) ?? null,
    voterTurnout: byId.get(CHAMBER_QUESTIONS.voterTurnout) ?? null,
    electionIntegrity: byId.get(CHAMBER_QUESTIONS.electionIntegrity) ?? null,
  };
});
