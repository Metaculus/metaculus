"use client";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import {
  MultipleChoiceTile,
  FanGraphTile,
} from "@/components/post_card/multiple_choice_tile";
import { getEffectiveVisibleCount } from "@/constants/questions";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
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

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  showChart?: boolean;
  minimalistic?: boolean;
  hideResolutionIcon?: boolean;
};

const GroupOfQuestionsTile: FC<Props> = ({
  post,
  showChart,
  minimalistic = false,
  hideResolutionIcon = false,
}) => {
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

  const canPredict = canPredictQuestion(post, user);
  const visibleCount = getEffectiveVisibleCount(questions.length);

  const choices = generateChoiceItemsFromGroupQuestions(
    post.group_of_questions,
    {
      activeCount: visibleCount,
      locale,
      excludeUnit: true,
      resolutionSigfigs: 4,
    }
  );

  switch (graph_type) {
    case GroupOfQuestionsGraphType.FanGraph: {
      return (
        <FanGraphTile
          choices={choices}
          visibleChoicesCount={visibleCount}
          group={post.group_of_questions}
          groupType={groupType}
          canPredict={canPredict}
          hideCP={hideCP}
          showChart={showChart}
          minimalistic={minimalistic}
          optionsLimit={10}
          hideResolutionIcon={hideResolutionIcon}
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
          visibleChoicesCount={visibleCount}
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
          showChart={showChart}
          minimalistic={minimalistic}
          hideResolutionIcon={hideResolutionIcon}
        />
      );
    }
    default:
      return null;
  }
};

export default GroupOfQuestionsTile;
