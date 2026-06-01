/** Occupation % change phrasing for labor-hub copy (client + server). */
export function formatOccupationChange(value: number): string {
  return `${value < 0 ? "shrink" : "grow"} ${Math.abs(value).toFixed(1)}%`;
}

export function occupationForecastClassName(value: number): string {
  return value < 0
    ? "text-mc-option-2 dark:text-mc-option-2-dark"
    : "text-mc-option-3 dark:text-mc-option-3-dark";
}
