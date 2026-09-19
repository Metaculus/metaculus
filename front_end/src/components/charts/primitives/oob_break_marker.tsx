"use client";
import React, { FC } from "react";

import { CHART_FONT_STYLE } from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

export type OobBreakMarkerDatum = {
  x?: number;
  y?: number;
  trueValue: number;
  formatValue: (value: number) => string;
};

type Props = {
  x?: number;
  y?: number;
  datum?: unknown;
};

// The bar itself is drawn with a literal gap (see `getDiscreteBarPath` in
// continuous_area_chart.tsx) so the break reads as an absence of the bar.
// This marker only needs to label the bar's true (un-clamped) value, shown
// just above where the bar is cut off at the axis top.
const OobBreakMarker: FC<Props> = ({ x, y, datum }) => {
  const { getThemeColor } = useAppTheme();
  const d = datum as OobBreakMarkerDatum | undefined;
  if (x == null || y == null || !d) return null;

  const strokeColor = getThemeColor(METAC_COLORS.gray["600"]);
  const label = d.formatValue(d.trueValue);

  return (
    <text
      x={x}
      y={y - 8}
      textAnchor="middle"
      style={{
        ...CHART_FONT_STYLE.tick,
        fill: strokeColor,
      }}
      aria-label="True value of an out-of-bounds bar clamped to the axis top"
    >
      {label}
    </text>
  );
};

export default OobBreakMarker;
