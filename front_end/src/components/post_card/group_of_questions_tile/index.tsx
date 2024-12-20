"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import GroupContinuousTile from "./group_continuous_tile";

type Props = {
  questions: QuestionWithForecasts[];
  post: PostWithForecasts;
  hideCP?: boolean;
};

const GroupOfQuestionsTile: FC<Props> = ({ questions, post, hideCP }) => {
  const t = useTranslations();
  const groupType = questions.at(0)?.type;

  if (!groupType) {
    return <div>{t("forecastDataIsEmpty")}</div>;
  }

  return (
    <GroupContinuousTile
      questions={questions as QuestionWithNumericForecasts[]}
      post={post}
      hideCP={hideCP}
    />
  );
};

export default GroupOfQuestionsTile;
