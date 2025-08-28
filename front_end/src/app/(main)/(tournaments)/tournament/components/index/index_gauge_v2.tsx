"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import PeriodMovement from "@/components/period_movement";
import RichText from "@/components/rich_text";
import {
  IndexPoint,
  IndexSeries,
  MultiYearIndexData,
  Tournament,
} from "@/types/projects";
import { MovementDirection } from "@/types/question";
import { isDefaultIndexData } from "@/utils/projects/helpers";

import { GREEN_R, NEUTRAL, RED_L } from "../../constants/colors";

type Props = {
  tournament: Tournament;
  barHeight?: number;
  multiYearIndexData?: MultiYearIndexData | null;
  year?: number;
};

const CAP_W = 3;
const CAP_H = 8;
const SEVEN_DAYS = 7 * 24 * 60 * 60;

const IndexGaugeV2: FC<Props> = ({
  tournament,
  barHeight = 8,
  multiYearIndexData,
  year,
}) => {
  const t = useTranslations();

  const series =
    pickSeries(multiYearIndexData, year) ??
    (isDefaultIndexData(tournament.index_data)
      ? tournament.index_data.series
      : null);

  if (!series?.line?.length) {
    return null;
  }

  const lastIdx = series.line.length - 1;
  const last = series.line[lastIdx];
  const nowTs = last?.x ?? 0;
  const weekAgoTs = nowTs - SEVEN_DAYS;

  const indexValue = clamp100(last?.y ?? 0);
  const indexWeekAgo = clamp100(valueAt(series.line, weekAgoTs) ?? indexValue);

  const deltaWeek = Number((indexValue - indexWeekAgo).toFixed(1));

  const leftLabel = tournament.index_data?.min_label ?? "Less democratic";
  const rightLabel = tournament.index_data?.max_label ?? "More democratic";
  const lowIsGood: boolean =
    Boolean(tournament.index_data?.increasing_is_good) ?? false;

  const leftColor = lowIsGood ? GREEN_R : RED_L;
  const rightColor = lowIsGood ? RED_L : GREEN_R;
  const trackBg = `linear-gradient(90deg, ${leftColor} 0%, ${NEUTRAL} 50%, ${rightColor} 100%)`;

  const valuePct = 50 + indexValue / 2;
  const chipPct = Math.max(1.5, Math.min(98.5, valuePct));

  let direction = MovementDirection.UNCHANGED;
  if (deltaWeek > 0) direction = MovementDirection.UP;
  else if (deltaWeek < 0) direction = MovementDirection.DOWN;

  return (
    <div className="mb-12 mt-4 flex w-full flex-col gap-2 sm:mb-9 sm:mt-6">
      <div className="flex items-center justify-between text-sm font-medium text-gray-500 dark:text-gray-500-dark">
        <span>{leftLabel}</span>
        <span className="relative">{t("baseline")}</span>
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
          style={{
            left: "50%",
            width: CAP_W,
            height: CAP_H,
            transform: "translate(-50%, -50%)",
          }}
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
              direction={direction}
              message={
                direction === MovementDirection.UNCHANGED ? (
                  t("weeklyMovementChange", { value: t("noChange") })
                ) : (
                  <RichText>
                    {(tags) =>
                      t.rich("indexWeeklyMovement", {
                        ...tags,
                        value: Math.abs(deltaWeek),
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

export default IndexGaugeV2;

function pickSeries(
  multi?: MultiYearIndexData | null,
  year?: number
): IndexSeries | null {
  if (multi?.years?.length) {
    const key = year
      ? String(year)
      : String(multi.years[multi.years.length - 1]);
    return multi.series_by_year?.[key] ?? null;
  }
  return null;
}

function valueAt(line: IndexPoint[], ts: number): number | null {
  if (!line?.length) return null;
  const firstTs = line[0]?.x ?? 0;
  const firstY = line[0]?.y ?? 0;
  const lastTs = line[line.length - 1]?.x ?? 0;
  const lastY = line[line.length - 1]?.y ?? 0;
  if (ts <= firstTs) return firstY;
  if (ts >= lastTs) return lastY;
  const i = line.findIndex((p) => p.x >= ts);
  if (i <= 0) return firstY;

  const p0 = line[i - 1];
  const p1 = line[i];
  if (!p0 || !p1) return lastY;
  const span = Math.max(1e-6, p1.x - p0.x);
  const t = (ts - p0.x) / span;
  return p0.y + t * (p1.y - p0.y);
}

function clamp100(v: number) {
  return Math.max(-100, Math.min(100, v));
}
