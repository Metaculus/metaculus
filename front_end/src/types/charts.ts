import { Quartiles } from "@/types/question";

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
