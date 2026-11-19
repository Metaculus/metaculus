import { isNil } from "lodash";

import {
  DistributionQuantileComponent,
  Quantile,
  QuantileValue,
} from "@/types/question";

// The rows of the regular (non-advanced) table, in order
const STANDARD_QUANTILES: QuantileValue["quantile"][] = [
  Quantile.lower,
  Quantile.q1,
  Quantile.q2,
  Quantile.q3,
  Quantile.upper,
];

/** Rows holding a percentile (filled in or not), as opposed to bound rows */
export function isPercentileRow(
  component: QuantileValue
): component is QuantileValue & { quantile: number | null } {
  return (
    component.quantile !== Quantile.lower &&
    component.quantile !== Quantile.upper
  );
}

/**
 * Whether components are exactly the regular table's rows: below lower
 * bound, 25th, 50th and 75th percentiles, above upper bound
 */
export function isStandardQuartileComponents(
  components: DistributionQuantileComponent
): boolean {
  return (
    components.length === STANDARD_QUANTILES.length &&
    components.every((c, i) => c.quantile === STANDARD_QUANTILES[i])
  );
}

/** Whether components can only be represented by the advanced table */
export function hasAdvancedQuantileComponents(
  components: DistributionQuantileComponent
): boolean {
  return components.length > 0 && !isStandardQuartileComponents(components);
}

export function makeBlankPercentileRow(): QuantileValue {
  return { quantile: null, value: undefined, isDirty: true };
}

/**
 * Orders rows as: below lower bound, percentiles ascending (unfilled
 * percentiles last, in their current order), above upper bound. Row objects
 * are kept as-is, so callers can track row identity.
 */
export function sortQuantileRows(
  components: DistributionQuantileComponent
): DistributionQuantileComponent {
  const percentiles = components.filter(isPercentileRow);
  return [
    ...components.filter((c) => c.quantile === Quantile.lower),
    ...percentiles
      .filter((c) => !isNil(c.quantile))
      .sort((a, b) => Number(a.quantile) - Number(b.quantile)),
    ...percentiles.filter((c) => isNil(c.quantile)),
    ...components.filter((c) => c.quantile === Quantile.upper),
  ];
}
