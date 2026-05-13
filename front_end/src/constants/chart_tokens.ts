import { CHART_DASH } from "./chart_dash";
import { CHART_POINT_SIZE, CHART_STROKE_WIDTH } from "./chart_stroke";
import { CHART_FONT_STYLE } from "./chart_typography";

export type ChartThemeOverride = {
  typography?: Partial<typeof CHART_FONT_STYLE>;
  dash?: Partial<typeof CHART_DASH>;
  stroke?: Partial<typeof CHART_STROKE_WIDTH>;
  point?: Partial<typeof CHART_POINT_SIZE>;
};

export type ResolvedChartTokens = {
  typography: typeof CHART_FONT_STYLE;
  dash: typeof CHART_DASH;
  stroke: typeof CHART_STROKE_WIDTH;
  point: typeof CHART_POINT_SIZE;
};

export function resolveChartTokens(
  override?: ChartThemeOverride
): ResolvedChartTokens {
  return {
    typography: { ...CHART_FONT_STYLE, ...override?.typography },
    dash: { ...CHART_DASH, ...override?.dash },
    stroke: { ...CHART_STROKE_WIDTH, ...override?.stroke },
    point: { ...CHART_POINT_SIZE, ...override?.point },
  };
}
