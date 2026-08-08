export const CHART_FONT_FAMILY = "Inter, sans-serif";

export const CHART_FONT_SIZE = {
  tick: 10,
  axisLabel: 11,
  cursor: 10,
  tooltip: 12,
} as const;

const tabularNums = "tabular-nums" as const;

export const CHART_FONT_STYLE = {
  tick: {
    fontFamily: CHART_FONT_FAMILY,
    fontSize: CHART_FONT_SIZE.tick,
    fontVariantNumeric: tabularNums,
  },
  axisLabel: {
    fontFamily: CHART_FONT_FAMILY,
    fontSize: CHART_FONT_SIZE.axisLabel,
    fontVariantNumeric: tabularNums,
  },
  cursor: {
    fontFamily: CHART_FONT_FAMILY,
    fontSize: CHART_FONT_SIZE.cursor,
    fontVariantNumeric: tabularNums,
  },
  tooltip: {
    fontFamily: CHART_FONT_FAMILY,
    fontSize: CHART_FONT_SIZE.tooltip,
    fontVariantNumeric: tabularNums,
  },
} as const;
