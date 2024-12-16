"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts, PostStatus } from "@/types/post";
import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import GroupContinuousTile from "./group_continuous_tile";

type Props = {
  questions: QuestionWithForecasts[];
  curationStatus: PostStatus;
  post: PostWithForecasts;
  hideCP?: boolean;
  forecasters?: number;
};

const GroupOfQuestionsTile: FC<Props> = ({
  questions,
  curationStatus,
  post,
  hideCP,
  forecasters,
}) => {
  const t = useTranslations();
  const groupType = questions.at(0)?.type;

  if (!groupType) {
    return <div>{t("forecastDataIsEmpty")}</div>;
  }

  return (
    <GroupContinuousTile
      questions={questions as QuestionWithNumericForecasts[]}
      curationStatus={curationStatus}
      post={post}
      hideCP={hideCP}
      forecasters={forecasters}
    />
  );
};

export default GroupOfQuestionsTile;
