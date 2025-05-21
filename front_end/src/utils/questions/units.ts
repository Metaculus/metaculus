export const formatValueUnit = (value: string, unit?: string) => {
  if (!unit) return value;

  return unit === "%" ? `${value}%` : `${value} ${unit}`;
};

// Max length of a unit to be treated as compact
const QUESTION_UNIT_COMPACT_LENGTH = 3;
export const isUnitCompact = (unit?: string) =>
  unit && unit.length <= QUESTION_UNIT_COMPACT_LENGTH;
