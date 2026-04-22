"use client";

import { useLaborHubChartHover } from "./labor_hub_chart_hover_context";
import {
  MultiLineChart,
  type MultiLineChartProps,
} from "./question_cards/multi_line_chart";

export function LaborHubMultiLineChart(props: MultiLineChartProps) {
  const hoverState = useLaborHubChartHover();

  if (!hoverState) {
    return <MultiLineChart {...props} />;
  }

  return (
    <MultiLineChart
      {...props}
      highlightedX={hoverState.hoverYear}
      onHighlightedXChange={hoverState.setHoverYear}
      clearHighlightOnMouseLeave={false}
    />
  );
}
