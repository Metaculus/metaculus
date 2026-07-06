import { Question, QuestionType } from "@/types/question";
import { TranslationKey } from "@/types/translations";
export enum Strengths {
  Low = "low",
  Medium = "medium",
  High = "high",
}
export type QuestionLinkDirection = "positive" | "negative";
export type QuestionLinkStrength = "low" | "medium" | "high";
export enum LinkTypes {
  Causal = "causal",
}

export enum Certainty {
  Strong = "strong",
  Medium = "medium",
  Weak = "weak",
  None = "none",
}

export type CoherenceLink = {
  question1_id: number;
  question1?: Question;
  question2_id: number;
  question2?: Question;
  direction: number;
  strength: number;
  type: LinkTypes;
  id: number;
};

export type FetchedCoherenceLinks = {
  data: (CoherenceLink & {
    question1: Question;
    question2: Question;
  })[];
};

export const ALLOWED_COHERENCE_LINK_QUESTION_TYPES = [
  QuestionType.Binary,
  QuestionType.Numeric,
  QuestionType.Discrete,
  QuestionType.Date,
];

export const DIRECTION_OPTIONS = [-1, 1];

// Persisted strength values stored in the DB and their display labels. The
// three tiers are rendered in order, so the array order matters.
export const STRENGTH_TIERS: readonly {
  value: number;
  label: TranslationKey;
}[] = [
  { value: 1, label: "aBit" },
  { value: 2, label: "mid" },
  { value: 5, label: "aLot" },
];

export type AggregateCoherenceLinkVoteBucket = {
  score: number;
  count: number;
};

export type AggregateCoherenceLinkVotesSummary = {
  aggregated_data: AggregateCoherenceLinkVoteBucket[];
  user_vote: number | null | undefined;
  count: number;
  strength?: number | null;
};

export type FetchedAggregateCoherenceLink = CoherenceLink & {
  rsem: number | null;
  links_nr: number;
  direction: number | null;
  strength: number | null;
  votes?: AggregateCoherenceLinkVotesSummary;
  freshness?: number;
};

export type FetchedAggregateCoherenceLinks = {
  data: FetchedAggregateCoherenceLink[];
};
