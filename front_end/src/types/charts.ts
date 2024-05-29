export type TickFormat = (
  value: number,
  index?: number,
  ticks?: number[]
) => string;

export type Scale = {
  ticks: number[];
  tickFormat: TickFormat;
};

export type BaseChartData = {
  xScale: Scale;
  yScale: Scale;
};

export type Line = Array<{ x: number; y: number }>;
export type Area = Array<{ x: number; y: number; y0?: number }>;
