import { Directions } from "@/types/coherence";
import { QuestionType } from "@/types/question";

export const getTermByDirectionAndQuestionType = (
  direction: Directions,
  type: QuestionType | null
):
  | "increases"
  | "decreases"
  | "hastens"
  | "delays"
  | "positive"
  | "negative" => {
  if (type === QuestionType.Numeric) {
    return direction === Directions.Positive ? "increases" : "decreases";
  } else if (type === QuestionType.Date) {
    return direction === Directions.Positive ? "hastens" : "delays";
  } else {
    return direction === Directions.Positive ? "positive" : "negative";
  }
};
