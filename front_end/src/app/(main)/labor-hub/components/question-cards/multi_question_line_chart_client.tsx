"use client";

import { useCallback } from "react";

import { MultiLineChart, type MultiLineChartProps } from "./multi_line_chart";

type Props = Omit<
  MultiLineChartProps,
  "formatXTick" | "formatYTick" | "formatYValue"
> & {
  xTickLabelsByValue: Record<string, string>;
  valueFormat?: "percentage" | "percentageChange" | "number";
  decimals?: number;
};

export function MultiQuestionLineChartClient({
  xTickLabelsByValue,
  valueFormat = "percentageChange",
  decimals = 1,
  ...props
}: Props) {
  const trimTrailingZeros = useCallback(
    (value: number) => {
      return Number(value.toFixed(decimals)).toString();
    },
    [decimals]
  );

  const formatXTick = useCallback(
    (xValue: number) => xTickLabelsByValue[String(xValue)] ?? String(xValue),
    [xTickLabelsByValue]
  );

  const formatYValue = useCallback(
    (value: number) => {
      switch (valueFormat) {
        case "number":
          return trimTrailingZeros(value);
        case "percentage":
          return `${trimTrailingZeros(value)}%`;
        case "percentageChange":
        default: {
          const rounded = trimTrailingZeros(value);
          const sign = value > 0 ? "+" : "";
          return `${sign}${rounded}%`;
        }
      }
    },
    [trimTrailingZeros, valueFormat]
  );

  const formatYTick = useCallback(
    (value: number) => {
      switch (valueFormat) {
        case "number":
          return value.toFixed(decimals);
        case "percentage":
          return `${value.toFixed(0)}%`;
        case "percentageChange":
        default: {
          if (value === 0) return "0%";
          const sign = value > 0 ? "+" : "";
          return `${sign}${value.toFixed(0)}%`;
        }
      }
    },
    [decimals, valueFormat]
  );

  return (
    <MultiLineChart
      {...props}
      formatXTick={formatXTick}
      formatYTick={formatYTick}
      formatYValue={formatYValue}
    />
  );
}
