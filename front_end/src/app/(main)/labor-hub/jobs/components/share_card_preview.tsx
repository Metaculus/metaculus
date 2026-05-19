import cn from "@/utils/core/cn";

import { type WallYear } from "../helpers/wall_types";

type Props = {
  jobName: string;
  forecasts: Record<WallYear, number | null>;
  forecasterCount?: number | null;
  year: WallYear;
  /** Render at the full 1200×630 size used by the screenshot service. */
  fullSize?: boolean;
};

function formatPercent(value: number | null): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(0)}%`;
}

function valueColor(value: number | null): string {
  if (value == null) return "#c8ccce";
  if (value > 0) return "#19d8a2";
  if (value < 0) return "#ff4642";
  return "#d7e7f7";
}

export function ShareCardPreview({
  jobName,
  forecasts,
  forecasterCount,
  year,
  fullSize = false,
}: Props) {
  const value = forecasts[year];

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden",
        fullSize ? "p-16" : "p-5 sm:p-7"
      )}
      style={{ background: "#283441" }}
    >
      <div
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: "#a9c0d6" }}
      >
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: "#19d8a2" }}
        />
        Metaculus · Labor Automation Hub
      </div>

      <div className="my-auto flex flex-col gap-2">
        <div
          className={cn(
            "font-geist-mono font-extrabold leading-none tracking-tight",
            fullSize ? "text-[180px]" : "text-6xl sm:text-7xl"
          )}
          style={{ color: valueColor(value) }}
        >
          {formatPercent(value)}
        </div>
        <div
          className={cn(
            "font-semibold leading-tight",
            fullSize ? "text-5xl" : "text-xl sm:text-2xl"
          )}
          style={{ color: "#d7e7f7" }}
        >
          {jobName}, by {year}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-end justify-between gap-2",
          fullSize ? "text-2xl" : "text-xs sm:text-sm"
        )}
        style={{ color: "#a9c0d6" }}
      >
        <span>
          {forecasterCount != null
            ? `Median of ${forecasterCount} forecasters`
            : "Live community forecast"}
        </span>
        <strong style={{ color: "#d7e7f7" }}>metaculus.com/labor-hub</strong>
      </div>
    </div>
  );
}
