"use client";

import { FC } from "react";

import { TimelineChartZoomOption } from "@/types/charts";
import { getChartZoomOptions } from "@/utils/charts/helpers";
import cn from "@/utils/core/cn";

type Props = {
  value: TimelineChartZoomOption;
  onChange: (value: TimelineChartZoomOption) => void;
  className?: string;
};

/**
 * Timeframe picker for the balance-of-power timelines. Same options and values as
 * the zoom picker built into ChartContainer — sourced from the same
 * `getChartZoomOptions` so the two can't drift — but fully rounded and hoisted
 * out of the chart so a single control drives all three at once.
 */
const TimelineRangeToggle: FC<Props> = ({ value, onChange, className }) => {
  const options = getChartZoomOptions();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-blue-400 bg-gray-0 p-1 dark:border-blue-400-dark dark:bg-gray-0-dark",
        className
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium uppercase leading-4 transition-colors",
              // Same active ink as the Key Drivers toggle (ToggleSelector), so the
              // two controls on this page read as the same kind of thing. blue-700
              // inverts across themes, which is what makes it dark-on-light and
              // light-on-dark. Applied per button rather than as that component's
              // sliding pill: its indicator is a fixed width for a two-way flip,
              // and these four segments differ in width.
              active
                ? "bg-blue-700 text-gray-0 dark:bg-blue-700-dark dark:text-gray-0-dark"
                : "text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default TimelineRangeToggle;
