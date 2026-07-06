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
