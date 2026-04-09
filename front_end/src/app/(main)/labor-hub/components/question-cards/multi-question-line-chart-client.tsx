"use client";

import { useCallback } from "react";

import { MultiLineChart, type MultiLineChartProps } from "./multi-line-chart";

type Props = Omit<MultiLineChartProps, "formatXTick" | "formatYValue"> & {
  xTickLabelsByValue: Record<string, string>;
  valueFormat?: "default" | "number";
  decimals?: number;
};

export function MultiQuestionLineChartClient({
  xTickLabelsByValue,
  valueFormat = "default",
  decimals = 1,
  ...props
}: Props) {
  const formatXTick = useCallback(
    (xValue: number) => xTickLabelsByValue[String(xValue)] ?? String(xValue),
    [xTickLabelsByValue]
  );

  const formatYValue =
    valueFormat === "number"
      ? (value: number) => value.toFixed(decimals)
      : undefined;

  return (
    <MultiLineChart
      {...props}
      formatXTick={formatXTick}
      formatYValue={formatYValue}
    />
  );
}
