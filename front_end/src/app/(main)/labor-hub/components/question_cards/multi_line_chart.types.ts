import type { ReactNode } from "react";

export type DataLabelPlacement = "above" | "below" | "inline";

export type DataLabelMode = "always" | "hover" | "never";

export type MultiLineChartPoint = {
  x: number;
  y: number;
  filled?: boolean;
  dotSize?: number;
};

export type MultiLineChartColor =
  | "green"
  | "gray"
  | "red"
  | "blue"
  | "mc1"
  | "mc2"
  | "mc3"
  | "mc4"
  | "mc5"
  | "mc6"
  | "mc7"
  | "mc8"
  | "mc9"
  | "mc10"
  | "mc11"
  | "mc12"
  | "mc13"
  | "mc14"
  | "mc15"
  | "mc16"
  | "mc17"
  | "mc18";

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
