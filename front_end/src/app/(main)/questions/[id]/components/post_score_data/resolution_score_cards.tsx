import {
  faArrowsUpToLine,
  faUsersLine,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC } from "react";

import ScoreCard from "@/components/question/score_card";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";
import { ScoreData } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
  noSectionWrapper?: boolean;
};

type ScoreBoxProps = {
  label: string;
  value: number;
  icon?: typeof faUsersLine;
  color: "orange" | "olive" | "gray";
  digits?: number;
};

const COLOR_CLASS = {
  orange: "text-orange-700 dark:text-orange-700-dark",
  olive: "text-olive-700 dark:text-olive-700-dark",
  gray: "text-gray-700 dark:text-gray-700-dark",
};

const ScoreBox: FC<ScoreBoxProps> = ({
  label,
  value,
  icon,
  color,
  digits = 1,
}) => {
  const colorClass = COLOR_CLASS[color];

  return (
    <div className="box flex flex-col items-center justify-center gap-1 border border-gray-400 p-2.5 text-center text-gray-700 dark:border-gray-400-dark dark:text-gray-700-dark">
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          className={cn("text-base leading-none", colorClass)}
        />
      )}

      <span className="text-sm font-normal">{label}</span>

      <div className={`text-sm font-bold leading-6 ${colorClass}`}>
        {label.toLowerCase().includes("coverage")
          ? `${(value * 100).toFixed(digits)}%`
          : value.toFixed(digits)}
      </div>
    </div>
  );
};

const getScore = (data: ScoreData | undefined, key: string) => {
  const field = (
    key.includes("coverage") ? key : `${key}_score`
  ) as keyof ScoreData;
  return data?.[field];
};

const iconForKey = (key: string) => {
  if (key.includes("peer")) return faUsersLine;
  if (key.includes("baseline")) return faArrowsUpToLine;
  return undefined;
};

const mustHideCommunity = (key: string) =>
  key === "coverage" || key === "weighted_coverage";

const toCamel = (s: string) =>
  s.replace(/(^|_)(\w)/g, (_, __, c: string) => c.toUpperCase());

/** Builds translation key e.g. "myPeerScore", "communityBaselineScore"  */
const buildScoreLabelKey = (
  t: any,
  key: string,
  forecaster: "user" | "community"
) => {
  const prefix = forecaster === "user" ? "my" : "community";
  const suffix = key.includes("coverage") ? "" : "Score";
  return t(prefix + toCamel(key) + suffix);
};

const ResolutionScoreCards: FC<Props> = ({
  post,
  isConsumerView,
  noSectionWrapper,
}) => {
  const t = useTranslations();
  const { question } = post;

  if (!question) return null;

  const cpScores =
    question.aggregations?.[question.default_aggregation_method]?.score_data;
  const userScores = question.my_forecasts?.score_data;

  if (!cpScores && !userScores) return null;

  const spot = question.default_score_type.startsWith("spot");
  const peerKey = spot ? "spot_peer" : "peer";
  const baselineKey = spot ? "spot_baseline" : "baseline";

  const scoreKeys = [
    "peer",
    "baseline",
    "spot_peer",
    "spot_baseline",
    "relative_legacy",
    "relative_legacy_archived",
    "coverage",
    "weighted_coverage",
  ];

  const renderPrimaryCards = () => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <ScoreCard
        type="peer"
        userScore={getScore(userScores, peerKey)}
        communityScore={getScore(cpScores, peerKey)}
        title={spot ? t("spotScore") : t("peerScore")}
        className={
          isConsumerView && !noSectionWrapper
            ? "bg-gray-0 dark:bg-gray-0-dark"
            : undefined
        }
      />
      <ScoreCard
        type="baseline"
        userScore={getScore(userScores, baselineKey)}
        communityScore={getScore(cpScores, baselineKey)}
        title={spot ? t("spotBaselineScore") : t("baselineScore")}
        className={
          isConsumerView && !noSectionWrapper
            ? "bg-gray-0 dark:bg-gray-0-dark"
            : undefined
        }
      />
    </div>
  );

  if (isConsumerView) {
    if (noSectionWrapper) {
      return renderPrimaryCards();
    }

    return (
      <SectionToggle title={t("scores")} defaultOpen>
        {renderPrimaryCards()}
      </SectionToggle>
    );
  }

  const secondaryBoxes: React.ReactNode[] = [];

  for (const key of scoreKeys) {
    if (key === peerKey || key === baselineKey) continue;

    const userVal = getScore(userScores, key);
    if (!isNil(userVal)) {
      secondaryBoxes.push(
        <ScoreBox
          key={`user-${key}`}
          label={buildScoreLabelKey(t, key, "user")}
          value={userVal}
          icon={iconForKey(key)}
          color="orange"
          digits={key.includes("relative_legacy") ? 2 : 1}
        />
      );
    }

    if (!mustHideCommunity(key)) {
      const cpVal = getScore(cpScores, key);
      if (!isNil(cpVal)) {
        secondaryBoxes.push(
          <ScoreBox
            key={`cp-${key}`}
            label={buildScoreLabelKey(t, key, "community")}
            value={cpVal}
            icon={iconForKey(key)}
            color="olive"
            digits={key.includes("relative_legacy") ? 2 : 1}
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {renderPrimaryCards()}

      {secondaryBoxes.length > 0 && (
        <SectionToggle title={t("additionalScores")} defaultOpen={false}>
          <div className="my-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {secondaryBoxes}
          </div>

          <div className="mb-4 flex flex-col gap-3 text-base font-normal leading-5 opacity-90">
            <div>
              {t("learnMoreAboutScores")}{" "}
              <Link
                href="/help/scores-faq/"
                className="text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
              >
                {t("here")}
              </Link>
              .
            </div>
          </div>
        </SectionToggle>
      )}
    </div>
  );
};

export default ResolutionScoreCards;
