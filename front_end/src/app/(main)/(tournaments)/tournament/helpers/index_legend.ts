import { GREEN_R, NEUTRAL, RED_L } from "../constants/colors";

type IndexBase = {
  min_label?: string | null;
  max_label?: string | null;
  increasing_is_good?: boolean | null;
};

export function getVerticalLegendProps(base?: IndexBase) {
  const minLabel = base?.min_label ?? "Less democratic";
  const maxLabel = base?.max_label ?? "More democratic";
  const lowIsGood = !!base?.increasing_is_good;

  return {
    topLabel: minLabel,
    bottomLabel: maxLabel,
    fromColor: lowIsGood ? GREEN_R : RED_L,
    midColor: NEUTRAL,
    toColor: lowIsGood ? RED_L : GREEN_R,
  };
}
