import { BaseRateDraft } from "@/types/key_factors";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

const DEFAULT_FREQ_NUM = 1;
const DEFAULT_FREQ_DEN = 10;

const getDefaultTrendYear = () => new Date().getFullYear() + 1;

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
    rate_numerator: DEFAULT_FREQ_NUM,
    rate_denominator: DEFAULT_FREQ_DEN,
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

  const base = {
    type: br.type,
    reference_class: br.reference_class ?? "",
    unit: br.unit ?? unitFallback,
    source: br.source ?? "",
  };

  if (br.type === "frequency") {
    return {
      ...base,
      rate_numerator: br.rate_numerator ?? null,
      rate_denominator: br.rate_denominator ?? null,
    };
  }

  return {
    ...base,
    projected_value: br.projected_value ?? null,
    projected_by_year: br.projected_by_year ?? null,
    extrapolation: br.extrapolation ?? "",
    based_on: br.based_on ?? "",
  };
};

export const switchBaseType = (
  draft: BaseRateDraft,
  type: "frequency" | "trend",
  unitFallback = ""
): BaseRateDraft => {
  const nextBase = coerceBaseForType(
    { ...draft, base_rate: { ...draft.base_rate, type } },
    unitFallback
  );

  if (type === "frequency") {
    return {
      ...draft,
      base_rate: {
        ...nextBase,
        rate_numerator:
          "rate_numerator" in nextBase && nextBase.rate_numerator != null
            ? nextBase.rate_numerator
            : DEFAULT_FREQ_NUM,
        rate_denominator:
          "rate_denominator" in nextBase && nextBase.rate_denominator != null
            ? nextBase.rate_denominator
            : DEFAULT_FREQ_DEN,
      },
    } as BaseRateDraft;
  }

  return {
    ...draft,
    base_rate: {
      ...nextBase,
      projected_by_year:
        "projected_by_year" in nextBase && nextBase.projected_by_year != null
          ? nextBase.projected_by_year
          : getDefaultTrendYear(),
    },
  } as BaseRateDraft;
};
