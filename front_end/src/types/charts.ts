import {
  Bounds,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";

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

export type LinePoint<X = number, Y = number | null> = {
  x: X;
  y: Y;
  y1?: Y;
  y2?: Y;
  symbol?: string;
  size?: number;
};

export type Line<X = number, Y = number | null> = Array<LinePoint<X, Y>>;
export type Area<X = number, Y = number | null> = Array<{ x: X; y: Y; y0?: Y }>;

export type NumericChartType = "date" | "numeric" | "binary";

export type FanOption = {
  name: string;
  communityQuartiles: Quartiles | null;
  communityBounds: Bounds | null;
  userQuartiles: Quartiles | null;
  userBounds: Bounds | null;
  resolved: boolean;
  question: QuestionWithNumericForecasts;
};

export enum TimelineChartZoomOption {
  OneDay = "1d",
  OneWeek = "1w",
  TwoMonths = "2m",
  All = "all",
}

export type ContinuousAreaType =
  | "community"
  | "community_closed"
  | "user"
  | "user_previous"
  | "user_components";

export type ContinuousAreaHoverState = {
  x: number;
  yData: Record<ContinuousAreaType, number | null>;
};

export type ContinuousAreaGraphType = "pmf" | "cdf";

export enum ContinuousForecastInputType {
  Slider = "slider",
  Quantile = "quantile",
}
