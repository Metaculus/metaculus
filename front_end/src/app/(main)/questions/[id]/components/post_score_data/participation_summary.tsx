import { faClock } from "@fortawesome/free-regular-svg-icons";
import { faFire, faRepeat } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { PropsWithChildren, ReactNode } from "react";

import { QuestionWithForecasts } from "@/types/question";

const ParticipationItem: React.FC<PropsWithChildren<{ icon: ReactNode }>> = ({
  icon,
  children,
}) => {
  return (
    <div className="flex w-full items-center gap-2.5 rounded-xl bg-gray-0 px-2.5 py-1.5 text-xs dark:bg-purple-800/50">
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
};

const ParticipationSummary: React.FC<Props> = ({
  question,
  forecastsCount,
  forecastersCount,
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

  const userCoverage = userScores?.coverage ?? 0;
  const averageCoverage = question.average_coverage ?? 0;

  const isSpot = question.default_score_type.includes("spot");
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

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-lg bg-purple-100 px-4 py-3 dark:bg-purple-100-dark">
      <div className="text-lg font-medium text-purple-800 dark:text-purple-800-dark">
        {t("participationSummary")}
      </div>
      <div className="flex flex-col gap-2">
        <ParticipationItem icon={<FontAwesomeIcon icon={faRepeat} />}>
          {t.rich("participationSummaryPredictionNrStats", {
            strong: richStrong,
            communityUpdates: Math.round(communityUpdates * 10) / 10,
            userUpdates: Math.round(userUpdates * 10) / 10,
          })}
        </ParticipationItem>
        <ParticipationItem icon={<FontAwesomeIcon icon={faClock} />}>
          {t.rich(
            userCoverage >= averageCoverage
              ? "participationSummaryCoverageBetterStats"
              : "participationSummaryCoverageWorseStats",
            {
              strong: richStrong,
              userCoverage: Math.round(userCoverage * 100),
              averageCoverage: Math.round(averageCoverage * 100),
            }
          )}
        </ParticipationItem>
        {(outperformedPeer || outperformedBaseline) && (
          <ParticipationItem icon={<FontAwesomeIcon icon={faFire} />}>
            {t.rich("participationSummaryScoreOutperformance", {
              strong: richStrong,
              scoreTypes: getScoreTypes(),
            })}
          </ParticipationItem>
        )}
      </div>
    </div>
  );
};

export default ParticipationSummary;
