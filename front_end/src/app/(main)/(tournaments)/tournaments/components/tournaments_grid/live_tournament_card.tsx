"use client";

import {
  faHourglassHalf,
  faList,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import { TournamentPreview, TournamentTimeline } from "@/types/projects";
import cn from "@/utils/core/cn";
import { safeTs } from "@/utils/formatters/date";
import { formatMoneyUSD } from "@/utils/formatters/number";
import { formatTournamentRelativeDelta } from "@/utils/projects/helpers";

import PrivateBadge from "./private_badge";
import TournamentCardShell from "./tournament_card_shell";
import GradientProgressLine from "../../../tournament/components/gradient_progress_line";

type Props = {
  item: TournamentPreview;
  nowTs?: number;
  hideTimeline?: boolean;
};

const LiveTournamentCard: React.FC<Props> = ({
  item,
  nowTs = 0,
  hideTimeline = false,
}) => {
  const t = useTranslations();
  const prize = useMemo(
    () => formatMoneyUSD(item.prize_pool),
    [item.prize_pool]
  );

  return (
    <TournamentCardShell item={item}>
      <div className="relative h-16 w-full bg-blue-100/40 dark:bg-blue-100-dark/20 lg:h-20">
        {item.header_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.header_image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-blue-400 dark:bg-blue-400-dark">
            <FontAwesomeIcon
              icon={faList}
              className="text-[20px] text-blue-600/30 dark:text-blue-600-dark/30 lg:text-[24px]"
            />
          </div>
        )}
        {!item.default_permission && <PrivateBadge />}
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

      <div className="flex h-20 flex-col justify-between px-3 pb-3 pt-1.5 lg:h-[120px] lg:px-4 lg:pb-5 lg:pt-2">
        <h6 className="my-0 line-clamp-2 text-center text-sm font-semibold leading-[125%] text-blue-800 dark:text-blue-800-dark lg:text-left lg:text-lg lg:leading-[125%]">
          {item.name}
        </h6>

        {!hideTimeline && (
          <TournamentTimelineBar
            nowTs={nowTs}
            timeline={item.timeline ?? null}
            startDate={item.start_date ?? null}
            forecastingEndDate={item.forecasting_end_date ?? null}
            closeDate={item.close_date ?? null}
            isOngoing={Boolean(item.is_ongoing)}
          />
        )}
      </div>
    </TournamentCardShell>
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

  const now = nowTs ?? Date.now();

  const rawClosed =
    timeline?.all_questions_closed != null
      ? Boolean(timeline.all_questions_closed)
      : !isOngoing;

  const isClosed = rawClosed && now >= closedTs;
  const isResolved = Boolean(timeline?.all_questions_resolved);

  if (!isClosed) {
    return <ActiveMiniBar nowTs={now} startTs={startTs} endTs={closedTs} />;
  }

  return <ClosedStatus isResolved={isResolved} />;
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
  } else if (nowTs < startTs) {
    label = t("tournamentTimelineStarts", {
      when: formatTournamentRelativeDelta(t, startTs - nowTs, {
        fromNow: true,
      }),
    });
  } else {
    const sinceStart = nowTs - startTs;
    label =
      sinceStart < JUST_STARTED_MS
        ? t("tournamentTimelineJustStarted")
        : t("tournamentTimelineEnds", {
            when: formatTournamentRelativeDelta(t, endTs - nowTs, {
              fromNow: true,
            }),
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
      <div className="mt-2">
        <GradientProgressLine pct={+pct} />
      </div>
    </div>
  );
}

function ClosedStatus({ isResolved }: { isResolved: boolean }) {
  const t = useTranslations();
  const label = isResolved
    ? t("tournamentTimelinePendingWinners")
    : t("tournamentTimelineClosed");

  return (
    <div className="flex items-center justify-center gap-1.5 text-gray-700 dark:text-gray-700-dark">
      <FontAwesomeIcon icon={faHourglassHalf} className="text-[10px]" />
      <p className="my-0 text-[10px] font-normal">{label}</p>
    </div>
  );
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

const JUST_STARTED_MS = 36 * 60 * 60 * 1000;

export default LiveTournamentCard;
