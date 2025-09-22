import { Question, QuestionType } from "@/types/question";

export enum Directions {
  Positive = "positive",
  Negative = "negative",
}
export enum Strengths {
  Low = "low",
  Medium = "medium",
  High = "high",
}
export enum LinkTypes {
  Causal = "causal",
}
export type CoherenceLink = {
  question1_id: number;
  question1?: Question;
  question2_id: number;
  question2?: Question;
  direction: Directions;
  strength: Strengths;
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
  direction: Directions | null;
  strength: Strengths | null;
};

export type FetchedAggregateCoherenceLinks = {
  data: FetchedAggregateCoherenceLink[];
};

export const ALLOWED_COHERENCE_LINK_QUESTION_TYPES = [
  QuestionType.Binary,
  QuestionType.Numeric,
  QuestionType.Date,
];
