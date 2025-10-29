"use client";

import { FC } from "react";

const num = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export type DiffTooltipRow = {
  label: string;
  color: string;
  mean: number;
  lo: number;
  hi: number;
};

type Props = {
  quarter: string;
  rows: DiffTooltipRow[];
  rightTitle?: string;
};

const AIBDiffTooltip: FC<Props> = ({
  quarter,
  rows,
  rightTitle = "Avg Scores",
}) => {
  return (
    <div className="pointer-events-none w-[300px] rounded-[4px] bg-gray-0 shadow-[0_10px_24px_rgba(16,24,40,0.14),0_2px_8px_rgba(16,24,40,0.06)] dark:bg-gray-0-dark">
      <div className="flex items-center justify-between px-4 py-3 pb-2.5 text-sm text-gray-700 dark:text-gray-700-dark">
        <span>{quarter}</span>
        <span>{rightTitle}</span>
      </div>
      <div className="h-px w-full bg-gray-300 dark:bg-gray-300-dark" />
      <div className="space-y-[20px] p-4 pt-2.5">
        {rows.map(({ label, color, mean, lo, hi }) => (
          <div key={label} className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-2 text-gray-800 dark:text-gray-800-dark">
              <span
                aria-hidden
                className="inline-block h-4 w-4 rounded-[2px]"
                style={{ background: color }}
              />
              <span className="text-sm">{label}</span>
            </div>
            <div className="text-base tabular-nums leading-[125%] text-blue-800 dark:text-blue-800-dark">
              {num.format(mean)}{" "}
              <span className="text-gray-600 dark:text-gray-600-dark">
                [{num.format(lo)}, {num.format(hi)}]
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIBDiffTooltip;
