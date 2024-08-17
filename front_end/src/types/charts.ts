import { Quartiles } from "@/types/question";
import { ThemeColor } from "@/types/theme";

import { DomainTuple } from "victory";

export type TickFormat = (
  value: number,
  index?: number,
  ticks?: number[]
) => string;

export type Scale = {
  ticks: number[];
  tickFormat: TickFormat;
  cursorFormat?: TickFormat;
};

export type BaseChartData = {
  xScale: Scale;
  yScale: Scale;
};

export type Line<X = number, Y = number> = Array<{ x: X; y: Y }>;
export type Area<X = number, Y = number> = Array<{ x: X; y: Y; y0?: Y }>;
export type Interval<X = number, Y = number> = Array<{
  x: X;
  y: Y;
  lower?: Y;
  upper?: Y;
}>;

export type NumericChartType = "date" | "numeric" | "binary";

export type FanOption = {
  name: string;
  quartiles: Quartiles;
  resolved: boolean;
};

export enum TimelineChartZoomOption {
  OneDay = "1d",
  OneWeek = "1w",
  TwoMonths = "2m",
  All = "all",
}

export type ContinuousAreaType = "community" | "user";

export type ContinuousAreaHoverState = {
  x: number;
  yData: Record<ContinuousAreaType, number>;
};

export type ContinuousAreaGraphType = "pmf" | "cdf";

export type ForecastTimelineData = {
  label: string;
  color: ThemeColor;
  symbol?: string;
  highlighted: boolean;
  active: boolean;
  timestamps: number[];
  centers: number[];
  lowers?: number[];
  uppers?: number[];
  resolutionPoint?: {
    time: number;
    value: number; // internal representation
  };
};

export type ChartProps = {
  xScale: Scale;
  yScale: Scale;
  xDomain: DomainTuple;
  yDomain: DomainTuple;
};
