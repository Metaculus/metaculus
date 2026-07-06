"use client";

import { useTranslations } from "next-intl";
import React, { FC, PropsWithChildren } from "react";

import { ParticipationSummary } from "@/app/(main)/questions/[id]/components/post_score_data/participation_summary";
import { shouldPostShowScores } from "@/app/(main)/questions/[id]/components/post_score_data/utils";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { isQuestionPost } from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
};

const ParticipationSummaryQuestionTile: FC<PropsWithChildren<Props>> = ({
  post,
}) => {
  const t = useTranslations();

  if (
    !isQuestionPost(post) ||
    post.question.type == QuestionType.MultipleChoice ||
    !shouldPostShowScores(post)
  ) {
    return null;
  }

  const { question, nr_forecasters } = post;
  const userForecasts = question.my_forecasts?.history.length ?? 0;

  if (!userForecasts) {
    return null;
  }

  return (
    <div className="mt-4">
      <p className="my-0 mb-3 text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("participationSummary")}
      </p>

      <ParticipationSummary
        question={question}
        forecastsCount={post.forecasts_count ?? 0}
        forecastersCount={nr_forecasters}
        className="gap-1"
        itemClassName="bg-purple-100 dark:bg-purple-100-dark"
      />
    </div>
  );
};

export default ParticipationSummaryQuestionTile;
