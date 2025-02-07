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

export type Line<X = number, Y = number | null> = Array<{
  x: X;
  y: Y;
  y1?: Y;
  y2?: Y;
  symbol?: string;
}>;
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

export type ContinuousAreaType = "community" | "user" | "user_previous";

export type ContinuousAreaHoverState = {
  x: number;
  yData: Record<ContinuousAreaType, number | null>;
};

export type ContinuousAreaGraphType = "pmf" | "cdf";

export enum GroupOfQuestionsGraphType {
  FanGraph = "fan_graph",
  MultipleChoiceGraph = "multiple_choice_graph",
}

export type ForecastInputType = "slider" | "table";
