export const formatValueUnit = (value: string, unit?: string) => {
  if (!unit) return value;

  return unit === "%" ? `${value}%` : `${value} ${unit}`;
};

// Max length of a unit to be treated as compact
const QUESTION_UNIT_COMPACT_LENGTH = 3;
export const isUnitCompact = (unit?: string) =>
  unit && unit.length <= QUESTION_UNIT_COMPACT_LENGTH;

export function getCommonUnit(
  questions: Array<{
    unit?: string | null;
    scaling?: { unit?: string | null } | null;
  }>
): string | null {
  const units = questions
    .map((q) => (q.unit ?? q.scaling?.unit ?? "").trim())
    .filter(Boolean);

  if (units.length === 0) return null;

  const first = units[0];
  if (first === undefined) return null;

  return units.every((u) => u === first) ? first : null;
}
