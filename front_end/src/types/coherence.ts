export type Directions = "positive" | "negative";
export type Strengths = "low" | "medium" | "high";
export type LinkType = "causal";

export type CoherenceLink = {
  question1: number;
  question2: number;
  direction: Directions;
  strength: Strengths;
  type: LinkType;
};

export type CoherenceLinksGroup = {
  size: number;
  data: CoherenceLink[];
};
