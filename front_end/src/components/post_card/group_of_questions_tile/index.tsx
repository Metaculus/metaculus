"use client";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { useHideCP } from "@/app/(main)/questions/[id]/components/cp_provider";
import {
  MultipleChoiceTile,
  FanGraphMultipleChoiceTile,
} from "@/components/post_card/multiple_choice_tile";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { GroupOfQuestionsGraphType, GroupOfQuestionsPost } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts/timestamps";
import { generateChoiceItemsFromGroupQuestions } from "@/utils/questions/choices";
import { getGroupForecastAvailability } from "@/utils/questions/forecastAvailability";
import {
  getPostDrivenTime,
  getContinuousGroupScaling,
} from "@/utils/questions/helpers";
import { canPredictQuestion } from "@/utils/questions/predictions";

const VISIBLE_CHOICES_COUNT = 3;

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
};

const GroupOfQuestionsTile: FC<Props> = ({ post }) => {
  const t = useTranslations();

  const { hideCP } = useHideCP();

  const { user } = useAuth();
  const locale = useLocale();

  const {
    group_of_questions: { graph_type, questions },
  } = post;

  const groupType = questions.at(0)?.type;
  const isBinaryGroup = groupType === QuestionType.Binary;
  const scaling = useMemo(
    () => (isBinaryGroup ? undefined : getContinuousGroupScaling(questions)),
    [isBinaryGroup, questions]
  );
  if (!groupType) {
    return <div>{t("forecastDataIsEmpty")}</div>;
  }

  const canPredict = canPredictQuestion(post);

  const choices = generateChoiceItemsFromGroupQuestions(
    post.group_of_questions,
    {
      activeCount: VISIBLE_CHOICES_COUNT,
      locale,
    }
  );

  switch (graph_type) {
    case GroupOfQuestionsGraphType.FanGraph: {
      return (
        <FanGraphMultipleChoiceTile
          choices={choices}
          visibleChoicesCount={VISIBLE_CHOICES_COUNT}
          group={post.group_of_questions}
          groupType={groupType}
          canPredict={canPredict}
          hideCP={hideCP}
        />
      );
    }
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      const forecastAvailability = getGroupForecastAvailability(questions);
      const timestamps = getGroupQuestionsTimestamps(questions, {
        withUserTimestamps: !!forecastAvailability.cpRevealsOn,
      });

      const actualCloseTime = getPostDrivenTime(post.actual_close_time);
      const openTime = getPostDrivenTime(post.open_time);
      return (
        <MultipleChoiceTile
          choices={choices}
          timestamps={timestamps}
          actualCloseTime={actualCloseTime}
          openTime={openTime}
          visibleChoicesCount={VISIBLE_CHOICES_COUNT}
          defaultChartZoom={
            user
              ? TimelineChartZoomOption.All
              : TimelineChartZoomOption.TwoMonths
          }
          scaling={scaling}
          group={post.group_of_questions}
          groupType={groupType}
          forecastAvailability={forecastAvailability}
          canPredict={canPredict}
          hideCP={hideCP}
        />
      );
    }
    default:
      return null;
  }
};

export default GroupOfQuestionsTile;
