import { isNil } from "lodash";
import { MessageKeys, useTranslations } from "next-intl";

import {
  DistributionQuantileComponent,
  DistributionQuantileComponentWithState,
  QuestionWithNumericForecasts,
} from "@/types/question";

type ValidationErrorKey = MessageKeys<IntlMessages, keyof IntlMessages>;
export function validateQuantileInput({
  question,
  components,
  newValue,
  quantile,
  t,
}: {
  question: QuestionWithNumericForecasts;
  components: DistributionQuantileComponentWithState[];
  newValue: number | undefined;
  quantile: keyof DistributionQuantileComponent;
  t: ReturnType<typeof useTranslations>;
}): string | undefined {
  const comp = components[0];
  const { open_lower_bound, open_upper_bound } = question;
  const { range_min, range_max } = question.scaling;

  if (isNil(range_min) || isNil(range_max) || !comp) {
    return t("unexpectedError");
  }
  if (isNil(newValue)) {
    return t("quantileEmptyError");
  }
  // Check for strictly increasing quantiles
  if (
    quantile === "q1" &&
    ((comp.q2.value && newValue >= comp.q2.value) ||
      (comp.q3.value && newValue >= comp.q3.value))
  ) {
    return t("q1LessThanError");
  }
  if (
    quantile === "q2" &&
    ((comp.q1.value && newValue <= comp.q1.value) ||
      (comp.q3.value && newValue >= comp.q3.value))
  ) {
    return t("q2BetweenError");
  }
  if (
    quantile === "q3" &&
    ((comp.q1.value && newValue <= comp.q1.value) ||
      (comp.q2.value && newValue <= comp.q2.value))
  ) {
    return t("q3GreaterThanError");
  }
  // Check probability inputs
  if (
    (quantile === "p0" || quantile === "p4") &&
    (newValue <= 0 || newValue >= 100)
  ) {
    return t("probabilityRangeError");
  }

  // Check if quantile out of closed bounds
  if (
    !open_lower_bound &&
    ["q1", "q2", "q3"].some((q) => q === quantile) &&
    newValue < range_min
  ) {
    return t("quantileBelowBoundError");
  }
  if (
    !open_upper_bound &&
    ["q1", "q2", "q3"].some((q) => q === quantile) &&
    newValue > range_max
  ) {
    return t("quantileAboveBoundError");
  }

  // If any quantile is out of bounds, then there should be at least that probability out of that bound
  for (const validation of QUANTILE_OUT_OF_BOUND_VALIDATIONS) {
    const isLowerBoundCheck = validation.boundType === "lower";
    const boundValue = isLowerBoundCheck ? range_min : range_max;
    const boundFlag = isLowerBoundCheck ? open_lower_bound : open_upper_bound;
    const probabilityValue = isLowerBoundCheck ? comp.p0 : comp.p4;

    if (
      quantile === validation.quantile &&
      boundFlag &&
      ((isLowerBoundCheck && newValue < boundValue) ||
        (!isLowerBoundCheck && newValue > boundValue)) &&
      probabilityValue.value &&
      probabilityValue.value < validation.percentileValue
    ) {
      return t(validation.errorMessageKey);
    }

    if (
      quantile === (isLowerBoundCheck ? "p0" : "p4") &&
      boundFlag &&
      comp[validation.quantile as keyof typeof comp] &&
      ((isLowerBoundCheck &&
        (comp[validation.quantile as keyof typeof comp]?.value as number) <
          boundValue) ||
        (!isLowerBoundCheck &&
          (comp[validation.quantile as keyof typeof comp]?.value as number) >
            boundValue)) &&
      newValue < validation.percentileValue
    ) {
      return t(validation.errorMessageKey);
    }
  }

  return undefined;
}

export function validateAllQuantileInputs({
  question,
  components,
  t,
  checkDirtyState = true,
}: {
  question: QuestionWithNumericForecasts;
  components: DistributionQuantileComponentWithState[];
  t: ReturnType<typeof useTranslations>;
  checkDirtyState?: boolean;
}): boolean {
  if (!components.length) return false;

  const comp = components[0];
  if (!comp) return false;

  if (checkDirtyState) {
    const someDirty = Object.values(comp).some(
      (value) => value?.isDirty === true
    );

    if (!someDirty) {
      return false;
    }
  }

  const quantilesToValidate = [
    question.open_lower_bound ? "p0" : undefined,
    "q1",
    "q2",
    "q3",
    question.open_upper_bound ? "p4" : undefined,
  ].filter(
    (quantile) => quantile !== undefined
  ) as (keyof DistributionQuantileComponent)[];

  return !quantilesToValidate.some((quantile) => {
    const value = comp[quantile]?.value;
    const validationError = validateQuantileInput({
      question,
      components,
      newValue: value,
      quantile,
      t,
    });
    return validationError !== undefined;
  });
}

type QuantileCheck = {
  quantile: string;
  percentileValue: number;
  errorMessageKey: ValidationErrorKey;
  boundType: "lower" | "upper";
};

const QUANTILE_OUT_OF_BOUND_VALIDATIONS: QuantileCheck[] = [
  {
    quantile: "q1",
    percentileValue: 25,
    errorMessageKey: "q1BelowRangeError",
    boundType: "lower",
  },
  {
    quantile: "q1",
    percentileValue: 75,
    errorMessageKey: "q1AboveRangeError",
    boundType: "upper",
  },
  {
    quantile: "q2",
    percentileValue: 50,
    errorMessageKey: "q2BelowRangeError",
    boundType: "lower",
  },
  {
    quantile: "q2",
    percentileValue: 50,
    errorMessageKey: "q2AboveRangeError",
    boundType: "upper",
  },
  {
    quantile: "q3",
    percentileValue: 75,
    errorMessageKey: "q3BelowRangeError",
    boundType: "lower",
  },
  {
    quantile: "q3",
    percentileValue: 25,
    errorMessageKey: "q3AboveRangeError",
    boundType: "upper",
  },
];
