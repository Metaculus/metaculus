"use client";

import { FC } from "react";

import { SERIES_META, type SeriesKey } from "./config";

export type BenchmarkRow = {
  x: string;
  pros: number;
  bots: number;
  baseline: number;
};

type Props = {
  quarter: string;
  row: BenchmarkRow;
  colors: Record<SeriesKey, string>;
  order?: SeriesKey[];
  labels?: Partial<Record<SeriesKey, string>>;
};

const DEFAULT_ORDER: SeriesKey[] = ["pros", "bots", "baseline"];

const AIBBenchmarkTooltip: FC<Props> = ({
  quarter,
  row,
  colors,
  order,
  labels,
}) => {
  const displayOrder = order ?? DEFAULT_ORDER;

  return (
    <div className="pointer-events-none relative w-[245px] space-y-5 rounded-[4px] bg-gray-0 p-4 pt-3 shadow-[0_10px_24px_rgba(16,24,40,0.14),0_2px_8px_rgba(16,24,40,0.06)] dark:bg-gray-0-dark">
      <div className="flex items-center justify-between gap-3 text-sm font-normal text-gray-700 antialiased dark:text-gray-700-dark">
        <span>{quarter}</span>
        <span>Avg. Score</span>
      </div>

      <div className="absolute left-0 right-0 top-5 h-[1px] bg-gray-300 dark:bg-gray-300-dark" />

      <div className="space-y-3">
        {displayOrder.map((key) => (
          <Row
            key={key}
            label={labels?.[key] ?? SERIES_META[key].label}
            value={row[key]}
            swatch={colors[key]}
          />
        ))}
      </div>
    </div>
  );
};

const Row: FC<{ label: string; value: number; swatch: string }> = ({
  label,
  value,
  swatch,
}) => (
  <div className="text-normal flex items-center justify-between font-medium leading-[125%] text-gray-800 antialiased dark:text-gray-800-dark">
    <div className="flex items-center gap-[10px]">
      <span
        aria-hidden
        className="inline-block h-4 w-4 rounded-[3px]"
        style={{ background: swatch }}
      />
      <span>{label}</span>
    </div>
    <span className="font-normal text-blue-800 dark:text-blue-800-dark">
      {value}
    </span>
  </div>
);

export default AIBBenchmarkTooltip;
