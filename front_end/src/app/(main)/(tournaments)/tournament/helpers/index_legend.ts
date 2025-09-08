import { IndexBase } from "@/types/projects";

const NEUTRAL = "#979A72";
const RED_L = "#D58B80";
const GREEN_R = "#66A566";

export function getIndexBounds(base?: {
  min?: number | null;
  max?: number | null;
}) {
  let MIN = Number.isFinite(base?.min as number) ? (base?.min as number) : -100;
  let MAX = Number.isFinite(base?.max as number) ? (base?.max as number) : 100;
  if (MIN > MAX) [MIN, MAX] = [MAX, MIN];
  return { MIN, MAX };
}

export function getVerticalLegendProps(base?: IndexBase | null) {
  const { MIN, MAX } = getIndexBounds(base ?? undefined);
  const minLabel = base?.min_label ? base?.min_label : String(MIN);
  const maxLabel = base?.max_label ? base?.max_label : String(MAX);
  const highIsGood = !!base?.increasing_is_good;

  return {
    topLabel: maxLabel,
    bottomLabel: minLabel,
    fromColor: highIsGood ? GREEN_R : RED_L,
    midColor: NEUTRAL,
    toColor: highIsGood ? RED_L : GREEN_R,
  };
}
