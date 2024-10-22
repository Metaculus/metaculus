"use client";
import { useTranslations } from "next-intl";
import { FC } from "react";

import GroupNumericTile from "@/components/post_card/group_of_questions_tile/group_numeric_tile";
import { PostWithForecasts, PostStatus } from "@/types/post";
import {
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

type Props = {
  questions: QuestionWithForecasts[];
  curationStatus: PostStatus;
  post: PostWithForecasts;
  hideCP?: boolean;
};

const GroupOfQuestionsTile: FC<Props> = ({
  questions,
  curationStatus,
  post,
  hideCP,
}) => {
  const t = useTranslations();
  const groupType = questions.at(0)?.type;

  if (!groupType) {
    return <div>{t("forecastDataIsEmpty")}</div>;
  }

  return (
    <GroupNumericTile
      questions={questions as QuestionWithNumericForecasts[]}
      curationStatus={curationStatus}
      post={post}
      hideCP={hideCP}
    />
  );
};

export default GroupOfQuestionsTile;
