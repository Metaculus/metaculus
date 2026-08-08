/**
 * Formats a forecast percentage with a sign, keeping up to `decimals` decimal
 * places but trimming trailing zeros. Small values are preserved (0.2 → "+0.2%")
 * rather than rounded away to "0%".
 */
export function formatSignedPercent(
  value: number | null,
  decimals = 1
): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const abs = Number(Math.abs(value).toFixed(decimals)).toString();
  return `${sign}${abs}%`;
}
