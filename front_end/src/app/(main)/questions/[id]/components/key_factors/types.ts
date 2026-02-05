import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { KeyFactor } from "@/types/comment";

export type KFType =
  | "driver"
  | "base_rate"
  | "news"
  | "ask_llm"
  | "question_link"
  | null;

export type TopItem =
  | { kind: "keyFactor"; keyFactor: KeyFactor }
  | { kind: "questionLink"; link: FetchedAggregateCoherenceLink };
