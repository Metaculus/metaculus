import type { ReactNode } from "react";

export type DataLabelPlacement = "above" | "below" | "inline";

export type DataLabelMode = "always" | "hover" | "never";

export type MultiLineChartPoint = {
  x: number;
  y: number;
};

export type MultiLineChartColor = "green" | "gray" | "red" | "blue";

export type MultiLineChartSeries = {
  id: string;
  data: MultiLineChartPoint[];
  color: MultiLineChartColor;
  filled?: boolean;
  label?: string;
  dashed?: boolean;
  dataLabels?: DataLabelMode;
  dotSize?: number;
  legendStyle?: "dot" | "line";
  legendDetail?: ReactNode;
  dataLabelPlacement?: DataLabelPlacement;
  dataLabelTransparent?: boolean;
  dataLabelClassName?: string;
  dataLabelRectClassName?: string;
  dataLabelTextClassName?: string;
};

export type MultiLineChartYAxisLabel = {
  text: string;
  value: number;
};

export type LineSeries = MultiLineChartSeries;
