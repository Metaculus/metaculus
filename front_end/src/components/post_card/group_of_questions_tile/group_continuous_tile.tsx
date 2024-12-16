import { differenceInMilliseconds } from "date-fns";
import { useLocale } from "next-intl";
import { FC, useMemo } from "react";

import {
  ContinuousMultipleChoiceTile,
  FanGraphMultipleChoiceTile,
} from "@/components/multiple_choice_tile";
import { useAuth } from "@/contexts/auth_context";
import {
  GroupOfQuestionsGraphType,
  TimelineChartZoomOption,
} from "@/types/charts";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromGroupQuestions,
  getContinuousGroupScaling,
  getGroupQuestionsTimestamps,
} from "@/utils/charts";
import {
  generateUserForecasts,
  getGroupForecastAvailability,
  sortGroupPredictionOptions,
} from "@/utils/questions";

const CHART_HEIGHT = 100;
const VISIBLE_CHOICES_COUNT = 3;

type Props = {
  questions: QuestionWithNumericForecasts[];
  post: PostWithForecasts;
  hideCP?: boolean;
};

const GroupContinuousTile: FC<Props> = ({ questions, post, hideCP }) => {
  const { user } = useAuth();
  const locale = useLocale();

  const questionType = questions[0].type;
  const isBinaryGroup = questionType === QuestionType.Binary;
  const scaling = useMemo(
    () => (isBinaryGroup ? undefined : getContinuousGroupScaling(questions)),
    [isBinaryGroup, questions]
  );
  const forecastAvailability = getGroupForecastAvailability(questions);

  const groupGraphType = post.group_of_questions?.graph_type;

  switch (groupGraphType) {
    case GroupOfQuestionsGraphType.FanGraph: {
      const sortedFanGraphQuestions = [...questions].sort((a, b) =>
        differenceInMilliseconds(
          new Date(b.scheduled_resolve_time),
          new Date(a.scheduled_resolve_time)
        )
      );
      const choices = generateChoiceItemsFromGroupQuestions(
        sortedFanGraphQuestions,
        {
          activeCount: VISIBLE_CHOICES_COUNT,
          locale,
          preserveOrder: true,
        }
      );

      return (
        <FanGraphMultipleChoiceTile
          choices={choices}
          visibleChoicesCount={VISIBLE_CHOICES_COUNT}
          questions={questions}
          questionType={questions[0].type}
          hideCP={hideCP}
          forecastAvailability={forecastAvailability}
          chartHeight={CHART_HEIGHT}
        />
      );
    }
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      const sortedQuestions = sortGroupPredictionOptions(questions);
      const timestamps = getGroupQuestionsTimestamps(sortedQuestions, {
        withUserTimestamps: !!forecastAvailability.cpRevealsOn,
      });
      const choices = generateChoiceItemsFromGroupQuestions(questions, {
        activeCount: VISIBLE_CHOICES_COUNT,
        locale,
      });
      const actualCloseTime = post.actual_close_time
        ? new Date(post.actual_close_time).getTime()
        : null;
      const openTime = post.open_time
        ? new Date(post.open_time).getTime()
        : undefined;
      return (
        <ContinuousMultipleChoiceTile
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
          userForecasts={
            user
              ? generateUserForecasts(
                  sortedQuestions as QuestionWithNumericForecasts[],
                  scaling
                )
              : undefined
          }
          questionType={questionType}
          hideCP={hideCP}
          forecastAvailability={forecastAvailability}
        />
      );
    }
    default:
      return null;
  }
};

export default GroupContinuousTile;
