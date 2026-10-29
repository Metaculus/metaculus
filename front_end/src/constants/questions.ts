import { QuestionType } from "@/types/question";

export const ANNULLED_RESOLUTION = "annulled";
export const AMBIGUOUS_RESOLUTION = "ambiguous";

export const DEFAULT_VISIBLE_CHOICES_COUNT = 4;

export function getEffectiveVisibleCount(
  totalOptions: number,
  defaultCount = DEFAULT_VISIBLE_CHOICES_COUNT
): number {
  return totalOptions === defaultCount + 1 ? totalOptions : defaultCount;
}

export const ContinuousQuestionTypes = [
  QuestionType.Numeric,
  QuestionType.Date,
  QuestionType.Discrete,
] as const;

// Session cookie with which staff view shadow aggregations (reputation_weighted)
// in place of the default one. Forwarded to the API as SHADOW_AGGREGATIONS_HEADER.
// The focused tab's setting; see utils/shadow_aggregations.ts.
export const SHADOW_AGGREGATIONS_COOKIE = "show_shadow_aggregations";
export const SHADOW_AGGREGATIONS_HEADER = "x-shadow-aggregations";
