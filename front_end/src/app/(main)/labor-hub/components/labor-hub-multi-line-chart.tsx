"use client";

import { useLaborHubChartHover } from "./labor-hub-chart-hover-context";
import {
  MultiLineChart,
  type MultiLineChartProps,
} from "./question-cards/multi-line-chart";

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
