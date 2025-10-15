import { Strengths } from "@/types/coherence";
import { QuestionType } from "@/types/question";

export const getTermByDirectionAndQuestionType = (
  direction: number,
  type: QuestionType | null
):
  | "increases"
  | "decreases"
  | "hastens"
  | "delays"
  | "positive"
  | "negative" => {
  if (type === QuestionType.Numeric) {
    return direction === +1 ? "increases" : "decreases";
  } else if (type === QuestionType.Date) {
    return direction === +1 ? "hastens" : "delays";
  } else {
    return direction === +1 ? "positive" : "negative";
  }
};
export function convertStrengthNumberToLabel(
  strength: number
): Strengths | null {
  const strengthMap: Record<number, Strengths> = {
    1: Strengths.Low,
    2: Strengths.Medium,
    3: Strengths.Medium,
    4: Strengths.High,
    5: Strengths.High,
  };
  return strengthMap[Math.round(strength)] ?? null;
}
