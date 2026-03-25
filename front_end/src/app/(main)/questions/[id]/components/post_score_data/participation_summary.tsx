import { faClock } from "@fortawesome/free-regular-svg-icons";
import {
  faCircleInfo,
  faFire,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { PropsWithChildren, ReactNode } from "react";

import Tooltip from "@/components/ui/tooltip";
import { QuestionWithForecasts } from "@/types/question";
import cn from "@/utils/core/cn";

const ParticipationItem: React.FC<
  PropsWithChildren<{ icon: ReactNode; className?: string }>
> = ({ icon, children, className }) => {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-2.5 rounded-xl bg-gray-0 px-2.5 py-1.5 text-xs dark:bg-purple-800/50",
        className
      )}
    >
      <div className="h-3.5 text-purple-700 dark:text-purple-700-dark">
        {icon}
      </div>
      <div>{children}</div>
    </div>
  );
};

type Props = {
  question: QuestionWithForecasts;
  forecastsCount: number;
  forecastersCount: number;
  className?: string;
  itemClassName?: string;
};

/**
 * Returns the max attainable peer coverage (0–1) for a question that resolved
 * before its scheduled close time, or null if not applicable.
 */
const getMaxCoverage = (question: QuestionWithForecasts): number | null => {
  const { open_time, actual_close_time, scheduled_close_time } = question;
  if (!open_time || !actual_close_time || !scheduled_close_time) return null;
  const open = new Date(open_time).getTime();
  const actualClose = new Date(actual_close_time).getTime();
  const scheduledClose = new Date(scheduled_close_time).getTime();
  const totalDuration = scheduledClose - open;
  if (totalDuration <= 0) return null;
  return (actualClose - open) / totalDuration;
};

export const ParticipationSummary: React.FC<Props> = ({
  question,
  forecastsCount,
  forecastersCount,
  className,
  itemClassName,
}) => {
  const t = useTranslations();

  const userForecasts = question.my_forecasts?.history.length ?? 0;
  const userScores = question.my_forecasts?.score_data;

  if (!userForecasts) {
    return null;
  }

  const communityScores =
    question.aggregations[question.default_aggregation_method]?.score_data;

  const communityUpdates =
    (forecastsCount - forecastersCount) / forecastersCount;
  const userUpdates = Math.max(userForecasts - 1, 0);

  const isSpot = question.default_score_type.includes("spot");

  const userCoverage = isSpot
    ? !isNil(userScores?.spot_peer_score)
      ? 1
      : 0
    : userScores?.coverage ?? 0;
  const averageCoverage = isSpot ? 1 : question.average_coverage ?? 0;
  const peerScoreKey = isSpot ? "spot_peer_score" : "peer_score";
  const baselineScoreKey = isSpot ? "spot_baseline_score" : "baseline_score";

  const outperformedPeer =
    !isNil(userScores?.[peerScoreKey]) &&
    !isNil(communityScores?.[peerScoreKey]) &&
    (userScores?.[peerScoreKey] ?? 0) > (communityScores?.[peerScoreKey] ?? 0);
  const outperformedBaseline =
    !isNil(userScores?.[baselineScoreKey]) &&
    !isNil(communityScores?.[baselineScoreKey]) &&
    (userScores?.[baselineScoreKey] ?? 0) >
      (communityScores?.[baselineScoreKey] ?? 0);

  const getScoreTypes = () => {
    if (outperformedPeer && outperformedBaseline)
      return isSpot ? t("bothSpotPeerAndBaseline") : t("bothPeerAndBaseline");
    if (outperformedPeer) return t(isSpot ? "spotPeerScore" : "peerScore");
    return t(isSpot ? "spotBaselineScore" : "baselineScore");
  };

  const richStrong = (chunk: ReactNode) => (
    <span className="font-bold text-purple-800 dark:text-purple-800-dark">
      {chunk}
    </span>
  );

  // Only peer coverage (non-spot) is affected by early resolution.
  const maxCoverage = isSpot ? null : getMaxCoverage(question);
  const richMaxCoverageDisplay = (_chunks: ReactNode) => {
    if (maxCoverage === null) return null;
    return (
      <span>
        {" (max. "}
        {Math.round(maxCoverage * 100)}%
        <Tooltip
          tooltipContent={t.rich("maxAttainableCoverageExplanation", {
            link: (chunks) => (
              <a
                href="https://www.metaculus.com/help/scores-faq/#score-truncation"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {chunks}
              </a>
            ),
          })}
        >
          <FontAwesomeIcon
            icon={faCircleInfo}
            className="ml-0.5 cursor-help text-blue-500 dark:text-blue-500-dark"
          />
        </Tooltip>
        {")"}
      </span>
    );
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <ParticipationItem
        icon={<FontAwesomeIcon icon={faRepeat} />}
        className={itemClassName}
      >
        {t.rich("participationSummaryPredictionNrStats", {
          strong: richStrong,
          communityUpdates: Math.round(communityUpdates * 10) / 10,
          userUpdates: Math.round(userUpdates * 10) / 10,
        })}
      </ParticipationItem>
      <ParticipationItem
        icon={<FontAwesomeIcon icon={faClock} />}
        className={itemClassName}
      >
        {t.rich(
          userCoverage >= averageCoverage
            ? "participationSummaryCoverageBetterStats"
            : "participationSummaryCoverageWorseStats",
          {
            strong: richStrong,
            userCoverage: Math.round(userCoverage * 100),
            averageCoverage: Math.round(averageCoverage * 100),
            maxCoverageDisplay: richMaxCoverageDisplay,
          }
        )}
      </ParticipationItem>
      {(outperformedPeer || outperformedBaseline) && (
        <ParticipationItem
          icon={<FontAwesomeIcon icon={faFire} />}
          className={itemClassName}
        >
          {t.rich("participationSummaryScoreOutperformance", {
            strong: richStrong,
            scoreTypes: getScoreTypes(),
          })}
        </ParticipationItem>
      )}
    </div>
  );
};

const ParticipationSummarySection: React.FC<Props> = ({
  question,
  forecastsCount,
  forecastersCount,
}) => {
  const t = useTranslations();

  const userForecasts = question.my_forecasts?.history.length ?? 0;

  if (!userForecasts) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-lg bg-purple-100 px-4 py-3 dark:bg-purple-100-dark">
      <div className="text-lg font-medium text-purple-800 dark:text-purple-800-dark">
        {t("participationSummary")}
      </div>
      <ParticipationSummary
        question={question}
        forecastsCount={forecastsCount}
        forecastersCount={forecastersCount}
      />
    </div>
  );
};

export default ParticipationSummarySection;
