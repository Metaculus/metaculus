import { useTranslations } from "next-intl";
import React, { FC } from "react";

import AdditionalScoresTable from "@/app/(main)/questions/[id]/components/post_score_data/additional_scores_table";
import ScoreCard from "@/components/question/score_card";
import SectionToggle from "@/components/ui/section_toggle";
import { PostWithForecasts } from "@/types/post";
import { ScoreData } from "@/types/question";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
  noSectionWrapper?: boolean;
};

const getScore = (data: ScoreData | undefined, key: string) => {
  const field = (
    key.includes("coverage") ? key : `${key}_score`
  ) as keyof ScoreData;
  return data?.[field];
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

  const renderPrimaryCards = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

  return (
    <div className="flex flex-col gap-4">
      {renderPrimaryCards()}
      <AdditionalScoresTable post={post} />
    </div>
  );
};

export default ResolutionScoreCards;
