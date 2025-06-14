import { QuestionType } from "@/types/question";

export const ANNULLED_RESOLUTION = "annulled";
export const AMBIGUOUS_RESOLUTION = "ambiguous";

export const ContinuousQuestionTypes = [
  QuestionType.Numeric,
  QuestionType.Date,
  QuestionType.Discrete,
] as const;
