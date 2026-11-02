import { isNil } from "lodash";

// One decimal below `threshold`, none from there on
export function formatCompact(value: number, threshold: number): string {
  const withDecimal = value.toFixed(1);
  return Math.abs(Number(withDecimal)) < threshold
    ? withDecimal
    : value.toFixed(0);
}

export function formatRankBound(value: number): string {
  return value.toFixed(0);
}

export function formatScoreBound(
  value: number,
  compactScores: boolean
): string {
  return compactScores ? formatCompact(value, 10) : value.toFixed(1);
}

// Widest formatted bound, in characters. Interval cells reserve this width for
// each bound so the dashes line up down the column.
export function maxBoundChars(
  bounds: (number | null | undefined)[],
  format: (value: number) => string
): number {
  return bounds.reduce<number>(
    (max, bound) => (isNil(bound) ? max : Math.max(max, format(bound).length)),
    0
  );
}
