"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import { ForecastPayload } from "@/services/questions";
import { GroupOfQuestionsPost } from "@/types/post";
import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

import GroupContinuousTile from "./group_continuous_tile";

type Props = {
  post: GroupOfQuestionsPost<QuestionWithForecasts>;
  hideCP?: boolean;
  onReaffirm?: (userForecast: ForecastPayload[]) => void;
};

const GroupOfQuestionsTile: FC<Props> = ({ post, hideCP, onReaffirm }) => {
  const t = useTranslations();
  const {
    group_of_questions: { questions },
  } = post;
  const groupType = questions.at(0)?.type;

  if (!groupType) {
    return <div>{t("forecastDataIsEmpty")}</div>;
  }

  return (
    <GroupContinuousTile
      post={post as GroupOfQuestionsPost<QuestionWithNumericForecasts>}
      hideCP={hideCP}
      onReaffirm={onReaffirm}
    />
  );
};

export default GroupOfQuestionsTile;
