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

/**
 * Renders the share card at a fixed 1.91:1 aspect ratio.
 * - `fullSize`: hard-coded pixel sizing for the screenshot service.
 * - Preview mode: container-query-based sizing so the card and its
 *   interior elements scale proportionally with the container width
 *   (mobile preview shrinks, desktop fills available space, ratio
 *   and visual hierarchy preserved).
 */
export function ShareCardPreview({
  jobName,
  forecasts,
  forecasterCount,
  year,
  fullSize = false,
}: Props) {
  const value = forecasts[year];

  if (fullSize) {
    return (
      <div
        className="relative flex h-full w-full flex-col justify-between overflow-hidden p-16"
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
            className="font-jetbrains-mono text-[180px] font-extrabold leading-none tracking-tight"
            style={{ color: valueColor(value) }}
          >
            {formatPercent(value)}
          </div>
          <div
            className="text-5xl font-semibold leading-tight"
            style={{ color: "#d7e7f7" }}
          >
            {jobName}, by {year}
          </div>
        </div>
        <div
          className="flex flex-wrap items-end justify-between gap-2 text-2xl"
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

  // Preview: container-query-based fluid sizing
  return (
    <div
      className={cn(
        "relative aspect-[1.91/1] w-full overflow-hidden rounded-md @container/share"
      )}
      style={{ background: "#283441" }}
    >
      <div className="flex h-full w-full flex-col justify-between p-[5.3cqw]">
        <div
          className="flex items-center gap-[1cqw] text-[1.7cqw] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#a9c0d6" }}
        >
          <span
            className="inline-block rounded-full"
            style={{ width: "0.6cqw", height: "0.6cqw", background: "#19d8a2" }}
          />
          Metaculus · Labor Automation Hub
        </div>
        <div className="flex flex-col gap-[1.2cqw]">
          <div
            className="font-jetbrains-mono text-[15cqw] font-extrabold leading-none tracking-tight"
            style={{ color: valueColor(value) }}
          >
            {formatPercent(value)}
          </div>
          <div
            className="text-[4cqw] font-semibold leading-tight"
            style={{ color: "#d7e7f7" }}
          >
            {jobName}, by {year}
          </div>
        </div>
        <div
          className="flex flex-wrap items-end justify-between gap-[1cqw] text-[2cqw]"
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
    </div>
  );
}
