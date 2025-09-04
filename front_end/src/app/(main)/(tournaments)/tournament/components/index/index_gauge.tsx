"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import PeriodMovement from "@/components/period_movement";
import RichText from "@/components/rich_text";
import { IndexSeries, MultiYearIndexData, Tournament } from "@/types/projects";
import { MovementDirection } from "@/types/question";
import {
  isDefaultIndexData,
  isMultiYearIndexData,
} from "@/utils/projects/helpers";

import { getIndexBounds } from "../../helpers/index_legend";

type Props = {
  tournament: Tournament;
  barHeight?: number;
  year?: number;
};

const CAP_W = 3;
const CAP_H = 8;
const SEVEN_DAYS = 7 * 24 * 60 * 60;

const GREEN_START = "#A3C9A399";
const GREEN_MID = "#C0C3AA99";
const RED_MID = "#C1C2AA99";
const RED_END = "#E6B9B399";

const IndexGauge: FC<Props> = ({ tournament, barHeight = 8, year }) => {
  const t = useTranslations();
  const idx = tournament.index_data;

  const series: IndexSeries | null =
    (isMultiYearIndexData(idx) ? pickSeries(idx, year) : null) ??
    (isDefaultIndexData(idx) ? idx.series : null);

  if (!series?.line?.length) {
    return null;
  }

  const baseIndex = idx ?? null;

  const { MIN, MAX } = getIndexBounds(baseIndex ?? undefined);

  const { latest: latestRaw, delta } = computeIndexDeltaFromSeries(series.line);
  const indexValue = clampToBounds(latestRaw ?? 0, MIN, MAX);

  const highIsGood = !!baseIndex?.increasing_is_good;

  const leftLabel = baseIndex?.min_label ? baseIndex?.min_label : String(MIN);
  const rightLabel = baseIndex?.max_label ? baseIndex?.max_label : String(MAX);

  const trackBg = highIsGood
    ? `linear-gradient(90deg, ${RED_END} 0%, ${RED_MID} 50%, ${GREEN_MID} 50%, ${GREEN_START} 100%)`
    : `linear-gradient(90deg, ${GREEN_START} 0%, ${GREEN_MID} 50%, ${RED_MID} 50%, ${RED_END} 100%)`;

  const span = Math.max(1e-6, MAX - MIN);
  const valuePct = ((indexValue - MIN) / span) * 100;
  const chipPct = Math.max(1.5, Math.min(98.5, valuePct));

  let direction = MovementDirection.UNCHANGED;
  if (delta > 0) direction = MovementDirection.UP;
  else if (delta < 0) direction = MovementDirection.DOWN;

  return (
    <div className="mb-12 mt-4 flex w-full flex-col gap-2 sm:mb-9 sm:mt-6">
      <div className="flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-500-dark">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>

      <div className="relative w-full" aria-label={t("indexValue")}>
        <div
          className="w-full rounded-sm"
          style={{ height: barHeight, background: trackBg }}
        />

        <div
          className="absolute top-1/2 -translate-y-1/2 bg-blue-700 dark:bg-blue-700-dark"
          style={{ left: 0, width: CAP_W, height: CAP_H }}
          aria-hidden
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 bg-blue-700 dark:bg-blue-700-dark"
          style={{ right: 0, width: CAP_W, height: CAP_H }}
          aria-hidden
        />

        <div
          className="absolute left-0 top-[86px] -translate-x-1/2 translate-y-[-150%] text-center"
          style={{ left: `${chipPct}%` }}
        >
          <span className="rounded-sm bg-gray-0 px-1.5 py-0.5 text-base font-bold text-blue-700 dark:bg-gray-0-dark dark:text-blue-700-dark">
            {indexValue.toFixed(1)}
          </span>
          <div className="text-sm font-normal text-gray-700 dark:text-gray-700-dark">
            {t("indexValue")}
          </div>

          <div className="mt-0.5 text-xs">
            <PeriodMovement
              highIsGood={highIsGood}
              direction={direction}
              message={
                direction === MovementDirection.UNCHANGED ? (
                  t("weeklyMovementChange", { value: t("noChange") })
                ) : (
                  <RichText>
                    {(tags) =>
                      t.rich("indexWeeklyMovement", {
                        ...tags,
                        value: Math.abs(delta),
                      })
                    }
                  </RichText>
                )
              }
              className="text-xs"
              iconClassName="text-xs font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexGauge;

function getYears(multi?: MultiYearIndexData | null): number[] {
  if (!multi?.series_by_year) return [];
  return Object.keys(multi.series_by_year)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);
}

function pickSeries(
  multi?: MultiYearIndexData | null,
  year?: number
): IndexSeries | null {
  if (!multi?.series_by_year) return null;
  const years = getYears(multi);
  if (!years.length) return null;
  const key = String(year ?? years[years.length - 1]);
  const s = multi.series_by_year[key];
  return s ?? null;
}

export function computeIndexDeltaFromSeries(
  line: { x: number; y: number }[] | undefined,
  periodSec = SEVEN_DAYS
): { latest: number; prev: number; delta: number } {
  if (!line || line.length === 0) {
    return { latest: 0, prev: 0, delta: 0 };
  }

  const latestPt = line[line.length - 1] ?? { x: 0, y: 0 };
  const cutoffTs = latestPt.x - periodSec;
  const prevPt = [...line].reverse().find((p) => p.x <= cutoffTs) ?? line[0];

  const latest = Number(latestPt.y ?? 0) || 0;
  const prev = Number(prevPt?.y ?? latest) || 0;

  const delta = Number((latest - prev).toFixed(1));

  return { latest, prev, delta };
}

function clampToBounds(v: number, MIN: number, MAX: number) {
  return Math.max(MIN, Math.min(MAX, v));
}
