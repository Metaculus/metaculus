import { useTranslations } from "next-intl";

import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithForecasts } from "@/types/question";
import { getAllOptionsHistory } from "@/utils/questions/helpers";

type TranslateFunction = ReturnType<typeof useTranslations>;

export type SubQuestionOption = {
  value: string | number;
  label: string;
};

export function parseSubQuestionOptions(
  t: TranslateFunction,
  postData: PostWithForecasts
): SubQuestionOption[] {
  if ("group_of_questions" in postData && postData.group_of_questions) {
    return postData.group_of_questions.questions.map((question) => ({
      value: question.id,
      label: question.label ?? t("questionFallbackLabel", { id: question.id }),
    }));
  }

  if ("conditional" in postData && postData.conditional) {
    return [
      { value: postData.conditional.question_yes.id, label: t("ifYes") },
      { value: postData.conditional.question_no.id, label: t("ifNo") },
    ];
  }

  if (
    "question" in postData &&
    postData.question?.type === QuestionType.MultipleChoice
  ) {
    const allOptions = getAllOptionsHistory(postData.question);
    return allOptions.map((option) => ({ value: option, label: option }));
  }

  return [];
}

/**
 * Derive the questionId to pass to the aggregation API.
 * Group/conditional: the selected numeric sub-question ID.
 * MC/simple: the parent question's ID.
 */
export function deriveQuestionId(
  postData: PostWithForecasts,
  selectedOption: string | number | null
): number | undefined {
  if (typeof selectedOption === "number") {
    return selectedOption;
  }

  if ("question" in postData && postData.question) {
    return postData.question.id;
  }

  return undefined;
}

/**
 * Derive the question object for metadata display and default config.
 * Group/conditional: find matching sub-question by ID.
 * MC/simple: return postData.question.
 */
export function deriveQuestion(
  postData: PostWithForecasts,
  selectedOption: string | number | null
): QuestionWithForecasts | null {
  if (typeof selectedOption === "number") {
    if ("group_of_questions" in postData && postData.group_of_questions) {
      return (
        (postData.group_of_questions.questions.find(
          (q) => q.id === selectedOption
        ) as QuestionWithForecasts | undefined) ?? null
      );
    }
    if ("conditional" in postData && postData.conditional) {
      if (postData.conditional.question_yes.id === selectedOption) {
        return postData.conditional
          .question_yes as unknown as QuestionWithForecasts;
      }
      if (postData.conditional.question_no.id === selectedOption) {
        return postData.conditional
          .question_no as unknown as QuestionWithForecasts;
      }
    }
  }

  if ("question" in postData && postData.question) {
    return postData.question;
  }

  return null;
}
