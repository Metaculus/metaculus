import { ReactNode } from "react";

import { DiseaseId } from "../config/diseases";
import { GhmValueKey } from "../config/questions";
import { SectionConfig } from "../config/sections";
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

export type EditionDistribution = {
  postId: number;
  // Community Prediction CDF of a numeric, discrete or date question.
  cdf: number[];
};

// What a past edition renders with, baked by `ghm:bake` at publication.
export type EditionArchive = {
  layout: SectionConfig[];
  // Keyed by question ID. Forecast history has no distributions, so archived cards draw these.
  distributions: Record<string, EditionDistribution>;
};

export type Edition = {
  // Publication month (YYYY-MM); also the ?edition= URL value.
  slug: string;
  // Publication instant. Its date is shown as the publication day, and past editions render
  // forecasts as of this time.
  asOf: string;
  takeaways: Takeaway[];
  sections: Partial<Record<DiseaseId, SectionEdition>>;
  // Values baked when the edition was finalized. Missing keys fall back to forecast history at asOf.
  frozen?: Partial<Record<GhmValueKey, FrozenValue>>;
  // Written by `ghm:bake` when the edition is finalized; required once it's no longer the latest.
  archive?: EditionArchive;
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
