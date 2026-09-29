import { ReactNode } from "react";

import { DiseaseId } from "../config/diseases";
import { GhmValueKey } from "../config/questions";
import { GhmSourceId } from "../config/sources";

export type SourceSnapshot = {
  source: GhmSourceId;
  label: string;
  value: string;
  // ISO date the figure refers to.
  asOf: string;
  url?: string;
};

export type ProCommentRef = {
  postId: number;
  commentId: number;
  author: string;
  date: string;
  excerpt: string;
};

export type Takeaway = {
  id: string;
  diseases: DiseaseId[];
  // Value whose question the linked timeline shows for this takeaway.
  lead: GhmValueKey;
  content: ReactNode;
};

export type SectionEdition = {
  body: ReactNode;
  proSummary?: ReactNode;
  quote?: ProCommentRef;
  sources?: SourceSnapshot[];
};

export type FrozenValue = {
  value: number | null;
  lower?: number | null;
  upper?: number | null;
  bound?: "above" | "below";
  // Option a "top" multiple choice ref pointed at when the edition was baked.
  option?: string;
};

export type Edition = {
  // Publication date (YYYY-MM-DD); also the ?edition= URL value.
  slug: string;
  // Instant the edition's numbers were taken; past editions render values as of this time.
  asOf: string;
  takeaways: Takeaway[];
  sections: Partial<Record<DiseaseId, SectionEdition>>;
  // Values baked when the edition was finalized. Missing keys fall back to forecast history at asOf.
  frozen?: Partial<Record<GhmValueKey, FrozenValue>>;
};

export function defineSources<T extends Record<string, SourceSnapshot>>(
  sources: T
): T {
  return sources;
}

export function defineProComments<T extends Record<string, ProCommentRef>>(
  comments: T
): T {
  return comments;
}
