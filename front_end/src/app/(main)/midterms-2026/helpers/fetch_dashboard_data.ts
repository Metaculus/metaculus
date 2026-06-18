import "server-only";
import { cache } from "react";

import { NumericAggregationExtraQuestion } from "@/app/(main)/aggregation-explorer/types";
import ServerAggregationsExplorerApi from "@/services/api/aggregation_explorer/aggregation_explorer.server";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";

import {
  CHAMBER_QUESTIONS,
  CONSEQUENCE_QUESTION_IDS,
  GOVERNOR_GROUP_POST_ID,
  GOVERNOR_RACES,
  SEAT_DISTRIBUTION_POSTS,
  SENATE_GROUP_POST_ID,
  SENATE_RACES,
  STANDALONE_GOVERNOR_RACES,
  type SenateRace,
  type StandaloneRace,
} from "../data";
import {
  getDemWinPct,
  getMultipleChoiceOptionProbability,
  getQuestionBinaryProbability,
  SenateRaceWithQuestion,
} from "./post_utils";

// Builds an enriched race from a group subquestion (matched by label).
function buildGroupRace(
  r: SenateRace,
  parentPost: PostWithForecasts | null,
  byLabel: Map<string, QuestionWithNumericForecasts>
): SenateRaceWithQuestion {
  const question = byLabel.get(r.subQuestionLabel) ?? null;
  return {
    ...r,
    parentPost,
    question,
    demWinPct: getDemWinPct(question),
    href:
      question && parentPost
        ? `/questions/${parentPost.id}/?sub-question=${question.id}`
        : null,
  };
}

// Builds an enriched race from a standalone multiple-choice post. The
// Democratic win pct is normalized to the two major parties so the map
// color reads as a clean Dem-vs-Rep split (ignoring any "Other" share).
function buildStandaloneRace(
  r: StandaloneRace,
  post: PostWithForecasts | null
): SenateRaceWithQuestion {
  const question =
    (post?.question as QuestionWithNumericForecasts | undefined) ?? null;
  const demProb = getMultipleChoiceOptionProbability(post, "Democrat");
  const repProb = getMultipleChoiceOptionProbability(post, "Republican");
  const demWinPct =
    demProb != null && repProb != null && demProb + repProb > 0
      ? Math.round((demProb / (demProb + repProb)) * 100)
      : null;
  return {
    state: r.state,
    name: r.name,
    subQuestionLabel: r.state,
    parentPost: post,
    question,
    demWinPct,
    href: post ? `/questions/${post.id}` : null,
  };
}

export const fetchSenateRaces = cache(
  async (): Promise<{
    races: SenateRaceWithQuestion[];
    parentPost: PostWithForecasts | null;
  }> => {
    if (!SENATE_GROUP_POST_ID) {
      return {
        races: SENATE_RACES.map((r) => buildGroupRace(r, null, new Map())),
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

    const races = SENATE_RACES.map((r) =>
      buildGroupRace(r, parentPost, byLabel)
    );

    return { races, parentPost };
  }
);

// Gubernatorial races: a group post (binary subquestions per state) plus the
// standalone Alaska & Maine multiple-choice posts. Returns the same enriched
// race shape as the senate races so the map can render either set.
export const fetchGovernorRaces = cache(
  async (): Promise<{ races: SenateRaceWithQuestion[] }> => {
    let groupPost: PostWithForecasts | null = null;
    if (GOVERNOR_GROUP_POST_ID) {
      try {
        groupPost = await ServerPostsApi.getPost(GOVERNOR_GROUP_POST_ID, true);
      } catch {
        groupPost = null;
      }
    }
    const subQuestions =
      (groupPost?.group_of_questions?.questions as
        | QuestionWithNumericForecasts[]
        | undefined) ?? [];
    const byLabel = new Map(subQuestions.map((q) => [q.label, q]));
    const groupRaces = GOVERNOR_RACES.map((r) =>
      buildGroupRace(r, groupPost, byLabel)
    );

    const standaloneIds = STANDALONE_GOVERNOR_RACES.map((r) => r.postId).filter(
      (id) => id > 0
    );
    let byId = new Map<number, PostWithForecasts>();
    if (standaloneIds.length) {
      try {
        const { results } = await ServerPostsApi.getPostsWithCP({
          ids: standaloneIds,
          limit: standaloneIds.length,
        });
        byId = new Map(results.map((p) => [p.id, p]));
      } catch {
        byId = new Map();
      }
    }
    const standaloneRaces = STANDALONE_GOVERNOR_RACES.map((r) =>
      buildStandaloneRace(r, byId.get(r.postId) ?? null)
    );

    return { races: [...groupRaces, ...standaloneRaces] };
  }
);

export type ConsequenceConditional = {
  id: number;
  href: string;
  title: string;
  /** "Democratic" subquestion → if Democrats control Congress. */
  demPct: number | null;
  /** "Mixed" subquestion → if control is split. */
  splitPct: number | null;
  /** "Republican" subquestion → if Republicans control Congress. */
  repPct: number | null;
};

// Each Electoral Consequences post is a group-of-questions conditional on
// control of Congress, with three binary subquestions labeled "Democratic" /
// "Republican" / "Mixed". We pull each branch's community probability. Rows
// keep rendering even when a branch's CP is not yet revealed (shown as "—").
export const fetchConsequenceConditionals = cache(
  async (): Promise<ConsequenceConditional[]> => {
    const ids = CONSEQUENCE_QUESTION_IDS.filter((id) => id > 0);
    if (!ids.length) return [];

    // Use the list endpoint (getPostsWithCP) rather than per-post getPost:
    // it surfaces the group subquestions' community prediction (the single
    // getPost endpoint does not include it on the deployed backend) and it
    // collapses N requests into one — matching how chamber/seat fetch.
    let byId = new Map<number, PostWithForecasts>();
    try {
      const { results } = await ServerPostsApi.getPostsWithCP({
        ids,
        limit: ids.length,
      });
      byId = new Map(results.map((p) => [p.id, p]));
    } catch {
      byId = new Map();
    }

    const pct = (
      q: QuestionWithNumericForecasts | undefined
    ): number | null => {
      const prob = getQuestionBinaryProbability(q ?? null);
      return prob != null ? Math.round(prob * 100) : null;
    };

    // Match the three scenario subquestions by keyword rather than an exact
    // label, so wording changes (e.g. "Mixed" → "Split Congress",
    // "Democratic" → "Democratic Congress") don't blank out the gauges.
    const findSub = (
      subs: QuestionWithNumericForecasts[],
      ...keywords: string[]
    ): QuestionWithNumericForecasts | undefined =>
      subs.find((q) => {
        const label = (q.label ?? "").toLowerCase();
        return keywords.some((k) => label.includes(k));
      });

    return ids
      .map((id): ConsequenceConditional | null => {
        const post = byId.get(id);
        if (!post) return null;
        const subs =
          (post.group_of_questions?.questions as
            | QuestionWithNumericForecasts[]
            | undefined) ?? [];
        return {
          id,
          href: `/questions/${id}`,
          title: post.short_title || post.title || "",
          demPct: pct(findSub(subs, "democrat")),
          splitPct: pct(findSub(subs, "split", "mixed")),
          repPct: pct(findSub(subs, "republican")),
        };
      })
      .filter((row): row is ConsequenceConditional => row !== null);
  }
);

export type ChamberData = {
  senateControl: PostWithForecasts | null;
  houseControl: PostWithForecasts | null;
  congressOutcome: PostWithForecasts | null;
  electionEmergency: PostWithForecasts | null;
  abortionAmendment: PostWithForecasts | null;
};

const EMPTY_CHAMBER_DATA: ChamberData = {
  senateControl: null,
  houseControl: null,
  congressOutcome: null,
  electionEmergency: null,
  abortionAmendment: null,
};

export const fetchChamberData = cache(async (): Promise<ChamberData> => {
  const ids = Object.values(CHAMBER_QUESTIONS).filter((id) => id > 0);
  if (!ids.length) return EMPTY_CHAMBER_DATA;

  try {
    const { results } = await ServerPostsApi.getPostsWithCP({
      ids,
      limit: ids.length,
    });
    const byId = new Map(results.map((p) => [p.id, p]));

    return {
      senateControl: byId.get(CHAMBER_QUESTIONS.senateControl) ?? null,
      houseControl: byId.get(CHAMBER_QUESTIONS.houseControl) ?? null,
      congressOutcome: byId.get(CHAMBER_QUESTIONS.congressOutcome) ?? null,
      electionEmergency: byId.get(CHAMBER_QUESTIONS.electionEmergency) ?? null,
      abortionAmendment: byId.get(CHAMBER_QUESTIONS.abortionAmendment) ?? null,
    };
  } catch {
    return EMPTY_CHAMBER_DATA;
  }
});

export type SeatDistributionDatum = {
  post: PostWithForecasts;
  /** Medalists-aggregation CDF (forecast_values), or null when unavailable. */
  medalistsCdf: number[] | null;
};

export type SeatDistributions = {
  senate: SeatDistributionDatum | null;
  house: SeatDistributionDatum | null;
};

// The seat-distribution charts render the Medalists community prediction,
// fetched via the same Aggregation Explorer endpoint the explorer UI uses.
const fetchMedalistsCdf = async (postId: number): Promise<number[] | null> => {
  try {
    const question = (await ServerAggregationsExplorerApi.getAggregations({
      postId,
      aggregationMethods: "silver_medalists",
      includeBots: false,
    })) as NumericAggregationExtraQuestion;
    return (
      question?.aggregations?.silver_medalists?.latest?.forecast_values ?? null
    );
  } catch {
    return null;
  }
};

export const fetchSeatDistributions = cache(
  async (): Promise<SeatDistributions> => {
    const senateId = SEAT_DISTRIBUTION_POSTS.senate;
    const houseId = SEAT_DISTRIBUTION_POSTS.house;
    const ids = [senateId, houseId].filter((id) => id > 0);
    if (!ids.length) return { senate: null, house: null };

    try {
      const [{ results }, senateCdf, houseCdf] = await Promise.all([
        ServerPostsApi.getPostsWithCP({ ids, limit: ids.length }),
        fetchMedalistsCdf(senateId),
        fetchMedalistsCdf(houseId),
      ]);
      const byId = new Map(results.map((p) => [p.id, p]));
      const toDatum = (
        id: number,
        medalistsCdf: number[] | null
      ): SeatDistributionDatum | null => {
        const post = byId.get(id);
        return post ? { post, medalistsCdf } : null;
      };
      return {
        senate: toDatum(senateId, senateCdf),
        house: toDatum(houseId, houseCdf),
      };
    } catch {
      return { senate: null, house: null };
    }
  }
);
