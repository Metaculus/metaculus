import { Question, QuestionType } from "@/types/question";
export enum Strengths {
  Low = "low",
  Medium = "medium",
  High = "high",
}
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

export type FetchedAggregateCoherenceLink = CoherenceLink & {
  rsem: number | null;
  links_nr: number;
  direction: number | null;
  strength: number | null;
};

export type FetchedAggregateCoherenceLinks = {
  data: FetchedAggregateCoherenceLink[];
};

export const ALLOWED_COHERENCE_LINK_QUESTION_TYPES = [
  QuestionType.Binary,
  QuestionType.Numeric,
  QuestionType.Date,
];

export const DIRECTION_OPTIONS = [-1, 1];
export const STRENGTH_OPTIONS = [1, 2, 5];
