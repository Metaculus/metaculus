import { isNil } from "lodash";
import { MessageKeys, useTranslations } from "next-intl";

import {
  DistributionQuantileComponent,
  Quantile,
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
  components: DistributionQuantileComponent;
  newValue: number | undefined;
  quantile: Quantile;
  t: ReturnType<typeof useTranslations>;
}): string | undefined {
  const { open_lower_bound, open_upper_bound } = question;
  const { range_min, range_max } = question.scaling;
  const probBelowLower = components[0]?.value;
  const probAboveUpper = components[components.length - 1]?.value;
  const q1 = components.find((q) => q.quantile === Quantile.q1)?.value;
  const q2 = components.find((q) => q.quantile === Quantile.q2)?.value;
  const q3 = components.find((q) => q.quantile === Quantile.q3)?.value;

  if (isNil(range_min) || isNil(range_max) || !components) {
    return t("unexpectedError");
  }
  if (isNil(newValue)) {
    return t("quantileEmptyError");
  }
  // Check for strictly increasing quantiles
  if (
    quantile === Quantile.q1 &&
    ((q2 && newValue >= q2) || (q3 && newValue >= q3))
  ) {
    return t("q1LessThanError");
  }
  if (
    quantile === Quantile.q2 &&
    ((q1 && newValue <= q1) || (q3 && newValue >= q3))
  ) {
    return t("q2BetweenError");
  }
  if (
    quantile === Quantile.q3 &&
    ((q1 && newValue <= q1) || (q2 && newValue <= q2))
  ) {
    return t("q3GreaterThanError");
  }

  // Check minimum distances between quantiles
  // 0.007 is the same limit as the clampStep in the ContinuousSlider
  const scale = range_max - range_min;
  const MIN_ABSOLUTE_DISTANCE = scale * 0.007;

  if (quantile === Quantile.q1) {
    if (q2 && Math.abs(newValue - q2) < MIN_ABSOLUTE_DISTANCE) {
      return t("quantileTooCloseError");
    }
  } else if (quantile === Quantile.q2) {
    if (
      (q1 && Math.abs(newValue - q1) < MIN_ABSOLUTE_DISTANCE) ||
      (q3 && Math.abs(newValue - q3) < MIN_ABSOLUTE_DISTANCE)
    ) {
      return t("quantileTooCloseError");
    }
  } else if (quantile === Quantile.q3) {
    if (q2 && Math.abs(newValue - q2) < MIN_ABSOLUTE_DISTANCE) {
      return t("quantileTooCloseError");
    }
  }

  // Check if quantile out of closed bounds
  if (
    !open_lower_bound &&
    [Quantile.q1, Quantile.q2, Quantile.q3].some((q) => q === quantile) &&
    newValue < range_min
  ) {
    return t("quantileBelowBoundError");
  }
  if (
    !open_upper_bound &&
    [Quantile.q1, Quantile.q2, Quantile.q3].some((q) => q === quantile) &&
    newValue > range_max
  ) {
    return t("quantileAboveBoundError");
  }

  // Check bound probability inputs (force 0.1% out of each open bound)
  if (quantile === Quantile.lower || quantile === Quantile.upper) {
    const isLowerBoundCheck = quantile === Quantile.lower;
    const isOpenBound = isLowerBoundCheck ? open_lower_bound : open_upper_bound;
    if (
      (isOpenBound && (newValue < 0.1 || newValue > 99.9)) ||
      (!isOpenBound && newValue !== 0)
    ) {
      return t("probabilityRangeError");
    }
    // Force 1% in range for bound probabilities
    if (
      probBelowLower &&
      probAboveUpper &&
      probBelowLower + probAboveUpper > 99
    ) {
      return t("probabilitySumError");
    }
  }

  // If any quantile is out of bounds, then there should be at least that probability out of that bound
  for (const validation of QUANTILE_OUT_OF_BOUND_VALIDATIONS) {
    const isLowerBoundCheck = validation.boundType === "lower";
    const boundValue = isLowerBoundCheck ? range_min : range_max;
    const isOpenBound = isLowerBoundCheck ? open_lower_bound : open_upper_bound;
    const probabilityValue = isLowerBoundCheck
      ? probBelowLower
      : probAboveUpper;
    const quantileValue = components.find(
      (q) => q.quantile === validation.quantile
    )?.value;

    if (validation.withinBounds) {
      // check if percentile is not greater then the bound within range

      if (
        quantile === (isLowerBoundCheck ? Quantile.lower : Quantile.upper) &&
        !isNil(quantileValue) &&
        ((isLowerBoundCheck && quantileValue >= boundValue) ||
          (!isLowerBoundCheck && quantileValue <= boundValue)) &&
        newValue >= validation.percentileValue
      ) {
        return t(validation.errorMessageKey);
      }
    } else {
      // validate quantile out of bounds
      if (
        quantile === validation.quantile &&
        isOpenBound &&
        ((isLowerBoundCheck && newValue < boundValue) ||
          (!isLowerBoundCheck && newValue > boundValue)) &&
        !isNil(probabilityValue) &&
        probabilityValue < validation.percentileValue
      ) {
        return t(validation.errorMessageKey);
      }

      // validate probability out of bounds
      if (
        quantile === (isLowerBoundCheck ? Quantile.lower : Quantile.upper) &&
        isOpenBound &&
        !isNil(quantileValue) &&
        ((isLowerBoundCheck && quantileValue < boundValue) ||
          (!isLowerBoundCheck && quantileValue > boundValue)) &&
        newValue < validation.percentileValue
      ) {
        return t(validation.errorMessageKey);
      }
    }
  }

  return undefined;
}

export function validateAllQuantileInputs({
  question,
  components,
  t,
}: {
  question: QuestionWithNumericForecasts;
  components: DistributionQuantileComponent;
  t: ReturnType<typeof useTranslations>;
}): {
  quantile: Quantile;
  message: string;
}[] {
  if (!components.length) {
    return [
      {
        quantile: Quantile.q1,
        message: t("unexpectedError"),
      },
    ];
  }

  const errors = components
    .map((q) => {
      return {
        quantile: q.quantile,
        message: validateQuantileInput({
          question,
          components,
          newValue: q.value,
          quantile: q.quantile,
          t,
        }),
      };
    })
    .filter(
      (error): error is { quantile: Quantile; message: string } =>
        error.message !== undefined
    );
  return errors;
}

export function validateUserQuantileData({
  question,
  components,
  cdf,
  t,
  checkInputData = true,
}: {
  question: QuestionWithNumericForecasts;
  components: DistributionQuantileComponent;
  cdf: number[];
  t: ReturnType<typeof useTranslations>;
  checkInputData?: boolean;
}): string[] {
  // Validate the quantile inputs
  const validationErrors = checkInputData
    ? validateAllQuantileInputs({
        question,
        components,
        t,
      }).map((error) => error.message)
    : [];

  // Validate the cdf dataset
  if (!cdf || cdf.length === 0) {
    validationErrors.push(t("emptyCdfError"));
    return validationErrors;
  }

  // Check CDF length
  if (cdf.length !== 201) {
    validationErrors.push(t("invalidCdfLengthError"));
    return validationErrors;
  }

  // Calculate PMF (differences between consecutive CDF values)
  const inboundPmf = [];
  for (let i = 0; i < cdf.length - 1; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const diff = cdf[i + 1]! - cdf[i]!;
    inboundPmf.push(Number(diff.toFixed(10)));
  }

  // Check minimum step size (0.00005)
  const minDiff = 0.01 / 200;
  if (inboundPmf.some((diff) => diff < minDiff)) {
    validationErrors.push(t("cdfMinStepSizeError", { minDiff }));
  }

  // Check maximum step size (0.59)
  const maxDiff = 0.59;
  if (inboundPmf.some((diff) => diff > maxDiff)) {
    validationErrors.push(t("cdfMaxStepSizeError", { maxDiff }));
  }
  return validationErrors.filter((error) => error !== undefined);
}

type QuantileCheck = {
  quantile: Quantile;
  percentileValue: number;
  errorMessageKey: ValidationErrorKey;
  boundType: "lower" | "upper";
  withinBounds?: boolean;
};

const QUANTILE_OUT_OF_BOUND_VALIDATIONS: QuantileCheck[] = [
  {
    quantile: Quantile.q1,
    percentileValue: 25,
    errorMessageKey: "q1BelowRangeError",
    boundType: "lower",
  },
  {
    quantile: Quantile.q1,
    percentileValue: 75,
    errorMessageKey: "q1AboveRangeError",
    boundType: "upper",
  },
  {
    quantile: Quantile.q2,
    percentileValue: 50,
    errorMessageKey: "q2BelowRangeError",
    boundType: "lower",
  },
  {
    quantile: Quantile.q2,
    percentileValue: 50,
    errorMessageKey: "q2AboveRangeError",
    boundType: "upper",
  },
  {
    quantile: Quantile.q3,
    percentileValue: 75,
    errorMessageKey: "q3BelowRangeError",
    boundType: "lower",
  },
  {
    quantile: Quantile.q3,
    percentileValue: 25,
    errorMessageKey: "q3AboveRangeError",
    boundType: "upper",
  },
  // validation when quartiles are within bounds
  {
    quantile: Quantile.q1,
    percentileValue: 25,
    errorMessageKey: "quantileWithinBoundsError",
    boundType: "lower",
    withinBounds: true,
  },
  {
    quantile: Quantile.q1,
    percentileValue: 75,
    errorMessageKey: "quantileWithinBoundsError",
    boundType: "upper",
    withinBounds: true,
  },
  {
    quantile: Quantile.q2,
    percentileValue: 50,
    errorMessageKey: "quantileWithinBoundsError",
    boundType: "lower",
    withinBounds: true,
  },
  {
    quantile: Quantile.q2,
    percentileValue: 50,
    errorMessageKey: "quantileWithinBoundsError",
    boundType: "upper",
    withinBounds: true,
  },
  {
    quantile: Quantile.q3,
    percentileValue: 75,
    errorMessageKey: "quantileWithinBoundsError",
    boundType: "lower",
    withinBounds: true,
  },
  {
    quantile: Quantile.q3,
    percentileValue: 25,
    errorMessageKey: "quantileWithinBoundsError",
    boundType: "upper",
    withinBounds: true,
  },
];
