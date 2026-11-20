import { countBy, isNil, round } from "lodash";
import { useTranslations } from "next-intl";

import {
  DefaultInboundOutcomeCount,
  DistributionQuantileComponent,
  Quantile,
  QuantileValue,
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import { TranslationKey } from "@/types/translations";
import {
  isPercentileRow,
  isStandardQuartileComponents,
} from "@/utils/forecasts/quantile_components";
import { unscaleNominalLocation } from "@/utils/math";

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
    ((q2 &&
      (newValue > q2 ||
        (range_min < q2 && q2 < range_max && newValue === q2))) ||
      (q3 &&
        (newValue > q3 ||
          (range_min < q3 && q3 < range_max && newValue === q3))))
  ) {
    return t("q1LessThanError");
  }
  if (
    quantile === Quantile.q2 &&
    ((q1 &&
      (newValue < q1 ||
        (range_min < q1 && q1 < range_max && newValue === q1))) ||
      (q3 &&
        (newValue > q3 ||
          (range_min < q3 && q3 < range_max && newValue === q3))))
  ) {
    return t("q2BetweenError");
  }
  if (
    quantile === Quantile.q3 &&
    ((q1 &&
      (newValue < q1 ||
        (range_min < q1 && q1 < range_max && newValue === q1))) ||
      (q2 &&
        (newValue < q2 ||
          (range_min < q2 && q2 < range_max && newValue === q2))))
  ) {
    return t("q3GreaterThanError");
  }

  // Check minimum distances between quantiles
  if (quantile === Quantile.q1) {
    if (q2 && checkNormalizedDistance(newValue, q2, question.scaling)) {
      return t("quantileTooCloseError");
    }
  } else if (quantile === Quantile.q2) {
    if (
      (q1 && checkNormalizedDistance(newValue, q1, question.scaling)) ||
      (q3 && checkNormalizedDistance(newValue, q3, question.scaling))
    ) {
      return t("quantileTooCloseError");
    }
  } else if (quantile === Quantile.q3) {
    if (q2 && checkNormalizedDistance(newValue, q2, question.scaling)) {
      return t("quantileTooCloseError");
    }
  }

  // Check if quantile out of closed bounds
  if ([Quantile.q1, Quantile.q2, Quantile.q3].some((q) => q === quantile)) {
    if (!open_lower_bound && newValue <= range_min) {
      return t("quantileBelowBoundError");
    }
  }
  if (!open_upper_bound && newValue >= range_max) {
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
  for (const validation of QUANTILE_BOUND_VALIDATIONS) {
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
        ((isLowerBoundCheck && quantileValue > boundValue) ||
          (!isLowerBoundCheck && quantileValue < boundValue)) &&
        newValue > validation.percentileValue
      ) {
        return t(validation.errorMessageKey);
      }
    } else {
      // validate quantile out of bounds
      if (
        quantile === validation.quantile &&
        isOpenBound &&
        ((isLowerBoundCheck && newValue <= boundValue) ||
          (!isLowerBoundCheck && newValue >= boundValue)) &&
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
        ((isLowerBoundCheck && quantileValue <= boundValue) ||
          (!isLowerBoundCheck && quantileValue >= boundValue)) &&
        newValue < validation.percentileValue
      ) {
        return t(validation.errorMessageKey);
      }
    }
  }

  return undefined;
}

export type QuantileValidationError = {
  quantile: QuantileValue["quantile"];
  // Index of the offending row in the components
  index: number;
  message: string;
  // Which cell of the row is at fault (advanced table); the value otherwise
  field?: "percentile" | "value";
};

/**
 * Validates table input: the regular table's rows (bounds + quartiles) with
 * the quartile-specific checks, anything else (the advanced table's
 * arbitrary percentiles) with validatePercentileInputs.
 */
export function validateAllQuantileInputs({
  question,
  components,
  t,
}: {
  question: QuestionWithNumericForecasts;
  components: DistributionQuantileComponent;
  t: ReturnType<typeof useTranslations>;
}): QuantileValidationError[] {
  if (!components.length) {
    return [
      {
        quantile: Quantile.q1,
        index: 0,
        message: t("unexpectedError"),
      },
    ];
  }

  if (!isStandardQuartileComponents(components)) {
    return validatePercentileInputs({ question, components, t });
  }

  return components
    .map((q, index) => ({
      quantile: q.quantile,
      index,
      message: validateQuantileInput({
        question,
        components,
        newValue: q.value,
        // Standard rows always have a Quantile
        quantile: q.quantile as Quantile,
        t,
      }),
    }))
    .filter(
      (error): error is QuantileValidationError => error.message !== undefined
    );
}

/**
 * The same rules as the regular table, for any set of percentile rows
 * (advanced table)
 */
function validatePercentileInputs({
  question,
  components,
  t,
}: {
  question: QuestionWithNumericForecasts;
  components: DistributionQuantileComponent;
  t: ReturnType<typeof useTranslations>;
}): QuantileValidationError[] {
  const errors: QuantileValidationError[] = [];
  const add = (
    index: number,
    message: string,
    field: QuantileValidationError["field"] = "value"
  ) => {
    if (errors.some((e) => e.index === index && e.message === message)) return;
    errors.push({
      quantile: components[index]?.quantile ?? null,
      index,
      message,
      field,
    });
  };

  const { open_lower_bound, open_upper_bound, scaling } = question;
  const { range_min, range_max } = scaling;
  const lowerIndex = components.findIndex((c) => c.quantile === Quantile.lower);
  const upperIndex = components.findIndex((c) => c.quantile === Quantile.upper);
  if (
    isNil(range_min) ||
    isNil(range_max) ||
    lowerIndex < 0 ||
    upperIndex < 0
  ) {
    return [{ quantile: null, index: 0, message: t("unexpectedError") }];
  }
  const probBelow = components[lowerIndex]?.value;
  const probAbove = components[upperIndex]?.value;

  // Out-of-bounds rows: same rules as the regular table
  for (const [index, isOpen] of [
    [lowerIndex, open_lower_bound],
    [upperIndex, open_upper_bound],
  ] as const) {
    const value = components[index]?.value;
    if (isNil(value)) {
      add(index, t("quantileEmptyError"));
    } else if (
      (isOpen && (value < 0.1 || value > 99.9)) ||
      (!isOpen && value !== 0)
    ) {
      add(index, t("probabilityRangeError"));
    }
  }
  if (probBelow && probAbove && probBelow + probAbove > 99) {
    add(lowerIndex, t("probabilitySumError"));
    add(upperIndex, t("probabilitySumError"));
  }

  // Percentile rows: all filled in, with valid, unique percentiles
  const rows = components
    .map((c, index) => ({ c, index }))
    .filter(({ c }) => isPercentileRow(c));
  const counts = countBy(
    rows.filter(({ c }) => !isNil(c.quantile)),
    ({ c }) => c.quantile
  );
  for (const { c, index } of rows) {
    const percentile = c.quantile as number | null;
    if (isNil(percentile)) {
      add(index, t("advancedTablePercentileEmptyError"), "percentile");
    } else if (!(percentile > 0 && percentile < 100)) {
      add(index, t("advancedTablePercentileRangeError"), "percentile");
    } else if ((counts[String(percentile)] ?? 0) > 1) {
      add(index, t("advancedTablePercentileDuplicateError"), "percentile");
    }
    if (isNil(c.value)) {
      add(index, t("quantileEmptyError"));
    }
  }

  // Filled rows in percentile order
  const filled = rows
    .flatMap(({ c, index }) =>
      isNil(c.quantile) || isNil(c.value)
        ? []
        : [{ percentile: Number(c.quantile), value: c.value, index }]
    )
    .sort((a, b) => a.percentile - b.percentile);
  const isInRange = (value: number) => range_min < value && value < range_max;

  // Values must increase with the percentile (they may only tie outside the
  // range, where many percentiles can share the out-of-bounds mass), and
  // stay apart inside the range, like the regular table's quartiles
  for (let i = 1; i < filled.length; i++) {
    const prev = filled[i - 1];
    const cur = filled[i];
    if (!prev || !cur || prev.percentile === cur.percentile) continue;
    if (
      cur.value < prev.value ||
      (cur.value === prev.value && isInRange(cur.value))
    ) {
      add(prev.index, t("advancedTableValuesOrderError"));
      add(cur.index, t("advancedTableValuesOrderError"));
    } else if (
      isInRange(prev.value) &&
      isInRange(cur.value) &&
      checkNormalizedDistance(prev.value, cur.value, scaling)
    ) {
      add(prev.index, t("quantileTooCloseError"));
      add(cur.index, t("quantileTooCloseError"));
    }
  }

  // Each value against the bounds and the out-of-bounds probabilities
  for (const { percentile, value, index } of filled) {
    const remaining = round(100 - percentile, 10);
    if (!open_lower_bound && value <= range_min) {
      add(index, t("quantileBelowBoundError"));
    }
    if (!open_upper_bound && value >= range_max) {
      add(index, t("quantileAboveBoundError"));
    }
    // Below the range, at least that much mass must be below the lower
    // bound; inside it, no more than that can be. Likewise above.
    const boundErrors: [boolean, string, number][] = [
      [
        !!open_lower_bound &&
          !isNil(probBelow) &&
          value <= range_min &&
          probBelow < percentile,
        t("advancedTableBelowRangeError", { percentile }),
        lowerIndex,
      ],
      [
        !!open_lower_bound &&
          !isNil(probBelow) &&
          value > range_min &&
          probBelow > percentile,
        t("advancedTableInRangeProbBelowError", { percentile }),
        lowerIndex,
      ],
      [
        !!open_upper_bound &&
          !isNil(probAbove) &&
          value >= range_max &&
          probAbove < remaining,
        t("advancedTableAboveRangeError", { percentile, remaining }),
        upperIndex,
      ],
      [
        !!open_upper_bound &&
          !isNil(probAbove) &&
          value < range_max &&
          probAbove > remaining,
        t("advancedTableInRangeProbAboveError", { percentile, remaining }),
        upperIndex,
      ],
    ];
    for (const [failed, message, boundIndex] of boundErrors) {
      if (failed) {
        add(index, message);
        add(boundIndex, message);
      }
    }
  }

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
  if (
    cdf.length !==
    (question.inbound_outcome_count || DefaultInboundOutcomeCount) + 1
  ) {
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

  // Check minimum step size (0.00005 for default continuous)
  // Guarantee that at least 1% of weight is evenly spread within bounds
  const minDiff = 0.01 / inboundPmf.length;
  if (inboundPmf.some((diff) => diff < minDiff)) {
    validationErrors.push(t("quantileTooCloseError"));
  }

  // Check maximum step size (0.59 for default continuous)
  // TODO: refine Discrete condition
  const maxDiff = question.type !== QuestionType.Discrete ? 0.59 : 0.99;
  if (inboundPmf.some((diff) => diff > maxDiff)) {
    validationErrors.push(t("quantileTooCloseError"));
  }

  // Check bounds
  if (!question.open_lower_bound && cdf[0] !== 0) {
    validationErrors.push(t("quantileTooCloseToClosedBound"));
  }
  if (!question.open_upper_bound && cdf[cdf.length - 1] !== 1) {
    validationErrors.push(t("quantileTooCloseToClosedBound"));
  }

  return validationErrors.filter((error) => error !== undefined);
}

type QuantileCheck = {
  quantile: Quantile;
  percentileValue: number;
  errorMessageKey: TranslationKey;
  boundType: "lower" | "upper";
  withinBounds?: boolean;
};

const QUANTILE_BOUND_VALIDATIONS: QuantileCheck[] = [
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
    errorMessageKey: "q1InRangeProbBelowError",
    boundType: "lower",
    withinBounds: true,
  },
  {
    quantile: Quantile.q1,
    percentileValue: 75,
    errorMessageKey: "q1InRangeProbAboveError",
    boundType: "upper",
    withinBounds: true,
  },
  {
    quantile: Quantile.q2,
    percentileValue: 50,
    errorMessageKey: "q2InRangeProbBelowError",
    boundType: "lower",
    withinBounds: true,
  },
  {
    quantile: Quantile.q2,
    percentileValue: 50,
    errorMessageKey: "q2InRangeProbAboveError",
    boundType: "upper",
    withinBounds: true,
  },
  {
    quantile: Quantile.q3,
    percentileValue: 75,
    errorMessageKey: "q3InRangeProbBelowError",
    boundType: "lower",
    withinBounds: true,
  },
  {
    quantile: Quantile.q3,
    percentileValue: 25,
    errorMessageKey: "q3InRangeProbAboveError",
    boundType: "upper",
    withinBounds: true,
  },
];

function checkNormalizedDistance(
  value1: number,
  value2: number,
  scaling: Scaling
): boolean {
  const normalized1 = unscaleNominalLocation(value1, scaling);
  const normalized2 = unscaleNominalLocation(value2, scaling);

  if (
    normalized1 === 0 ||
    normalized1 === 1 ||
    normalized2 === 0 ||
    normalized2 === 1
  )
    return false;

  // 0.007 is the same limit as the clampStep in the ContinuousSlider
  const NORMALIZED_MIN_DISTANCE = 0.007;
  return Math.abs(normalized1 - normalized2) < NORMALIZED_MIN_DISTANCE;
}
