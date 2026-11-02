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
