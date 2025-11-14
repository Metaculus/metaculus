import { BaseRateDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

export const getEffectiveUnit = (
  post: PostWithForecasts,
  draft?: BaseRateDraft
) => {
  let unit = isQuestionPost(post) ? post.question.unit : undefined;
  if (draft && isGroupOfQuestionsPost(post) && draft.question_id) {
    const sq = post.group_of_questions.questions.find(
      (q) => q.id === draft.question_id
    );
    unit = sq?.unit ?? unit;
  }
  return unit ?? "";
};

export const createEmptyBaseRateDraft = (initialUnit = ""): BaseRateDraft => ({
  base_rate: {
    type: "frequency",
    reference_class: "",
    rate_numerator: null,
    rate_denominator: null,
    unit: initialUnit,
    extrapolation: "",
    based_on: "",
    source: "",
  },
});

export const coerceBaseForType = (
  draft: BaseRateDraft,
  unitFallback = ""
): BaseRateDraft["base_rate"] => {
  const br = draft.base_rate;
  const common = {
    reference_class: br.reference_class ?? "",
    unit: br.unit ?? unitFallback,
    extrapolation: br.extrapolation ?? "",
    based_on: br.based_on ?? "",
    source: br.source ?? "",
  };

  if (br.type === "frequency") {
    return {
      type: "frequency",
      ...common,
      rate_numerator: br.rate_numerator ?? null,
      rate_denominator: br.rate_denominator ?? null,
    };
  }
  return {
    type: "trend",
    ...common,
    projected_value: br.projected_value ?? null,
    projected_by_year: br.projected_by_year ?? null,
  };
};

export const switchBaseType = (
  draft: BaseRateDraft,
  type: "frequency" | "trend",
  unitFallback = ""
): BaseRateDraft => {
  const next = { ...draft };
  next.base_rate = coerceBaseForType(
    { ...draft, base_rate: { ...draft.base_rate, type } },
    unitFallback
  );
  return next;
};
