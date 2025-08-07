import { Question } from "@/types/question";

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
  size: number;
  data: (CoherenceLink & {
    question1: Question;
    question2: Question;
  })[];
};
