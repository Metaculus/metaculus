import { GREEN_R, NEUTRAL, RED_L } from "../constants/colors";

type IndexBase = {
  min_label?: string | null;
  max_label?: string | null;
  increasing_is_good?: boolean | null;
};

export function getVerticalLegendProps(base?: IndexBase | null) {
  const minLabel = base?.min_label ? base?.min_label : "-100";
  const maxLabel = base?.max_label ? base?.max_label : "100";

  const highIsGood = !!base?.increasing_is_good;
  return {
    topLabel: minLabel,
    bottomLabel: maxLabel,
    fromColor: highIsGood ? RED_L : GREEN_R,
    midColor: NEUTRAL,
    toColor: highIsGood ? GREEN_R : RED_L,
  };
}
