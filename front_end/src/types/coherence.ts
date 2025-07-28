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
  question2_id: number;
  direction: Directions;
  strength: Strengths;
  type: LinkTypes;
  id: number;
};

export type CoherenceLinksGroup = {
  size: number;
  data: CoherenceLink[];
};
