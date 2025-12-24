"use client";

import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { TournamentPreview, TournamentTimeline } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

type Props = {
  item: TournamentPreview;
  nowTs?: number;
};

const LiveTournamentCard: React.FC<Props> = ({ item, nowTs = 0 }) => {
  const t = useTranslations();
  const prize = useMemo(
    () => formatMoneyUSD(item.prize_pool ?? null),
    [item.prize_pool]
  );

  const href = getProjectLink(item);

  return (
    <Link
      href={href}
      className={cn(
        "group block no-underline",
        "rounded-lg border border-blue-400 dark:border-blue-400-dark lg:rounded",
        "bg-gray-0/50 dark:bg-gray-0-dark/50",
        "shadow-sm transition-shadow hover:shadow-md",
        "overflow-hidden"
      )}
    >
      <div className="relative h-[64px] w-full bg-blue-100/40 dark:bg-blue-100-dark/20 lg:h-[80px]">
        {item.header_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.header_image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-2 px-3 pb-0 pt-3 text-xs lg:justify-between lg:px-4 lg:pb-[5px]">
        <div className="text-olive-900 dark:text-olive-900-dark">
          {prize && (
            <span
              className={cn(
                "rounded px-0.5 py-[1px] font-medium",
                "bg-olive-300 dark:bg-olive-300-dark"
              )}
            >
              {prize}
            </span>
          )}
          {prize ? ` ${t("tournamentPrizePool")}` : t("tournamentNoPrizePool")}
        </div>

        <div className="hidden items-center gap-1 font-medium text-gray-800 dark:text-gray-800-dark lg:flex">
          {item.forecasters_count ?? 0}
          <FontAwesomeIcon
            className="text-[8px] text-gray-400 dark:text-gray-400-dark"
            icon={faUsers}
          />
        </div>
      </div>

      <div className="flex h-[80px] flex-col justify-between px-3 pb-3 pt-1.5 lg:h-[120px] lg:px-4 lg:pb-5 lg:pt-2">
        <h6 className="my-0 text-center text-sm font-semibold leading-[125%] text-blue-800 dark:text-blue-800-dark lg:text-left lg:text-lg">
          {item.name}
        </h6>

        <TournamentTimelineBar
          nowTs={nowTs}
          timeline={item.timeline ?? null}
          startDate={item.start_date ?? null}
          forecastingEndDate={item.forecasting_end_date ?? null}
          closeDate={item.close_date ?? null}
          isOngoing={Boolean(item.is_ongoing)}
        />
      </div>
    </Link>
  );
};

function TournamentTimelineBar({
  nowTs,
  timeline,
  startDate,
  forecastingEndDate,
  closeDate,
  isOngoing,
}: {
  nowTs: number | null;
  timeline: TournamentTimeline | null;
  startDate?: string | null;
  forecastingEndDate?: string | null;
  closeDate?: string | null;
  isOngoing: boolean;
}) {
  const startTs = safeTs(startDate);
  const closedTs = safeTs(forecastingEndDate ?? closeDate ?? null);
  if (!startTs || !closedTs) return null;

  const isClosed =
    timeline?.all_questions_closed != null
      ? Boolean(timeline.all_questions_closed)
      : !isOngoing;

  const isResolved = Boolean(timeline?.all_questions_resolved);

  if (!isClosed) {
    return <ActiveMiniBar nowTs={nowTs} startTs={startTs} endTs={closedTs} />;
  }

  return (
    <ClosedMiniBar
      nowTs={nowTs}
      isResolved={isResolved}
      closeDate={closeDate ?? null}
      timeline={timeline}
    />
  );
}

function ActiveMiniBar({
  nowTs,
  startTs,
  endTs,
}: {
  nowTs: number | null;
  startTs: number;
  endTs: number;
}) {
  const t = useTranslations();
  let label = t("tournamentTimelineOngoing");
  let p = 0;

  if (nowTs == null) {
    label = t("tournamentTimelineOngoing");
    p = 0;
  } else if (nowTs < startTs) {
    label = t("tournamentTimelineStarts", {
      when: formatRelative(t, startTs - nowTs),
    });
    p = 0;
  } else {
    const sinceStart = nowTs - startTs;
    label =
      sinceStart < JUST_STARTED_MS
        ? t("tournamentTimelineJustStarted")
        : t("tournamentTimelineEnds", {
            when: formatRelative(t, endTs - nowTs),
          });

    const total = Math.max(1, endTs - startTs);
    p = clamp01((nowTs - startTs) / total);
  }

  const pct = (p * 100).toFixed(4);

  return (
    <div>
      <p className="my-0 hidden text-[10px] font-normal text-blue-700 dark:text-blue-700-dark lg:block">
        {label}
      </p>

      <div className="relative mt-2 h-[4px] w-full rounded-full bg-blue-400 dark:bg-blue-400-dark">
        <div
          className={cn(
            "h-full rounded-full",
            "bg-gradient-to-r from-blue-200 to-blue-700 dark:from-blue-200-dark dark:to-blue-700-dark"
          )}
          style={{ width: `${pct}%` }}
        />

        <Marker pct={+pct} />
      </div>
    </div>
  );
}

function Marker({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const left = `${clamped}%`;
  const thumbLeft = `clamp(5px, ${left}, calc(100% - 5px))`;

  return (
    <div
      className={cn(
        "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
        "bg-blue-700 dark:bg-blue-700-dark"
      )}
      style={{ left: thumbLeft }}
    />
  );
}

function ClosedMiniBar({
  nowTs,
  isResolved,
  timeline,
  closeDate,
}: {
  nowTs: number | null;
  isResolved: boolean;
  timeline: TournamentTimeline | null;
  closeDate: string | null;
}) {
  const t = useTranslations();
  const label = isResolved
    ? t("tournamentTimelineAllResolved")
    : t("tournamentTimelineClosed");
  let progress = isResolved ? 50 : 0;

  if (nowTs != null) {
    const resolvedTs = pickResolveTs(nowTs, timeline);
    const winnersTs = pickWinnersTs(resolvedTs, closeDate);

    if (resolvedTs && nowTs >= resolvedTs) progress = 50;
    if (winnersTs && nowTs >= winnersTs) progress = 100;
    if (isResolved) progress = Math.max(progress, 50);
  }

  return (
    <div>
      <p className="my-0 hidden text-[10px] font-normal text-blue-700 dark:text-blue-700-dark lg:block">
        {label}
      </p>

      <div className="relative mt-2 h-[4px] w-full rounded-full bg-blue-400 dark:bg-blue-400-dark">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-blue-700 dark:bg-blue-700-dark"
          style={{ width: `${progress}%` }}
        />

        <ClosedChip left="0%" active />
        <ClosedChip left="50%" active={progress >= 50} />
        <ClosedChip left="100%" active={progress >= 100} />
      </div>
    </div>
  );
}

function ClosedChip({
  left,
  active,
}: {
  left: "0%" | "50%" | "100%";
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "absolute top-1/2 z-10 h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full p-[3px]",
        active
          ? "bg-blue-700 dark:bg-blue-700-dark"
          : "bg-blue-400 dark:bg-blue-400-dark"
      )}
      style={{
        left:
          left === "0%" ? "5px" : left === "100%" ? "calc(100% - 5px)" : left,
      }}
    >
      <div
        className={cn(
          "h-full w-full rounded-full",
          active
            ? "bg-olive-400 dark:bg-olive-400-dark"
            : "bg-blue-400 dark:bg-blue-400-dark"
        )}
      />
    </div>
  );
}

function safeTs(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function formatRelative(
  t: ReturnType<typeof useTranslations>,
  deltaMs: number
) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0)
    return t("tournamentRelativeSoon");

  const sec = 1000;
  const min = 60 * sec;
  const hour = 60 * min;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (deltaMs > 20 * year) return t("tournamentRelativeFarFuture");
  if (deltaMs < min) return t("tournamentRelativeUnderMinute");

  const pick = () => {
    if (deltaMs < hour)
      return { n: Math.round(deltaMs / min), unit: "minute" as const };
    if (deltaMs < day)
      return { n: Math.round(deltaMs / hour), unit: "hour" as const };
    if (deltaMs < week)
      return { n: Math.round(deltaMs / day), unit: "day" as const };
    if (deltaMs < month)
      return { n: Math.round(deltaMs / week), unit: "week" as const };
    if (deltaMs < year)
      return { n: Math.round(deltaMs / month), unit: "month" as const };
    return { n: Math.round(deltaMs / year), unit: "year" as const };
  };

  const { n, unit } = pick();
  const unitLabel =
    n === 1
      ? t("tournamentUnit", { unit })
      : t("tournamentUnitPlural", { unit });

  return t("tournamentRelativeFromNow", { n, unit: unitLabel });
}

function formatMoneyUSD(amount: string | null | undefined) {
  if (!amount) return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  });
}

function pickResolveTs(nowTs: number, timeline: TournamentTimeline | null) {
  const scheduled = safeTs(timeline?.latest_scheduled_resolve_time);
  const actual = safeTs(timeline?.latest_actual_resolve_time);
  const isAllResolved = Boolean(timeline?.all_questions_resolved);
  let effectiveScheduled = scheduled;
  if (effectiveScheduled && nowTs >= effectiveScheduled && !isAllResolved) {
    effectiveScheduled = nowTs + ONE_DAY_MS;
  }

  return (isAllResolved ? actual : null) ?? effectiveScheduled ?? null;
}

function pickWinnersTs(resolvedTs: number | null, closeDate: string | null) {
  const closeTs = safeTs(closeDate);
  if (closeTs) return closeTs;
  return resolvedTs ? resolvedTs + TWO_WEEKS_MS : null;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const TWO_WEEKS_MS = 14 * ONE_DAY_MS;
const JUST_STARTED_MS = 36 * 60 * 60 * 1000;

export default LiveTournamentCard;
