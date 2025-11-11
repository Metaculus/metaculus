import { ImpactDirectionCategory } from "@/types/comment";
import { QuestionType } from "@/types/question";

export const firstVisible = (sel: string) => {
  return (
    [...document.querySelectorAll(sel)].find((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return (
        r.width &&
        r.height &&
        s.display !== "none" &&
        s.visibility === "visible"
      );
    }) || null
  );
};

export const convertNumericImpactToDirectionCategory = (
  impactDirection: -1 | 1 | null,
  certainty: -1 | null,
  questionType: QuestionType
): ImpactDirectionCategory | null => {
  if (certainty === -1) {
    return ImpactDirectionCategory.IncreaseUncertainty;
  }

  switch (questionType) {
    case QuestionType.Binary:
    case QuestionType.MultipleChoice:
      return impactDirection === -1
        ? ImpactDirectionCategory.Decrease
        : ImpactDirectionCategory.Increase;

    case QuestionType.Numeric:
    case QuestionType.Discrete:
      return impactDirection === -1
        ? ImpactDirectionCategory.Less
        : ImpactDirectionCategory.More;

    case QuestionType.Date:
      return impactDirection === -1
        ? ImpactDirectionCategory.Earlier
        : ImpactDirectionCategory.Later;

    default:
      return null;
  }
};
