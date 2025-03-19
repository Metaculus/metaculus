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
import { GroupOfQuestionsPost } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromGroupQuestions,
  getContinuousGroupScaling,
  getGroupQuestionsTimestamps,
} from "@/utils/charts";
import {
  canPredictQuestion,
  getGroupForecastAvailability,
  sortGroupPredictionOptions,
} from "@/utils/questions";

const CHART_HEIGHT = 100;
const VISIBLE_CHOICES_COUNT = 3;

type Props = {
  post: GroupOfQuestionsPost<QuestionWithNumericForecasts>;
  hideCP?: boolean;
};

const GroupContinuousTile: FC<Props> = ({ post, hideCP }) => {
  const { user } = useAuth();
  const locale = useLocale();

  const {
    group_of_questions: { questions, graph_type },
  } = post;
  const canPredict = canPredictQuestion(post);

  const questionType = questions[0]?.type;
  const isBinaryGroup = questionType === QuestionType.Binary;
  const scaling = useMemo(
    () => (isBinaryGroup ? undefined : getContinuousGroupScaling(questions)),
    [isBinaryGroup, questions]
  );
  const forecastAvailability = getGroupForecastAvailability(questions);

  const sortedQuestions = sortGroupPredictionOptions(
    questions,
    post.group_of_questions
  );

  switch (graph_type) {
    case GroupOfQuestionsGraphType.FanGraph: {
      const choices = generateChoiceItemsFromGroupQuestions(sortedQuestions, {
        activeCount: VISIBLE_CHOICES_COUNT,
        locale,
      });

      return (
        <FanGraphMultipleChoiceTile
          choices={choices}
          visibleChoicesCount={VISIBLE_CHOICES_COUNT}
          groupQuestions={questions}
          groupType={questionType}
          hideCP={hideCP}
          forecastAvailability={forecastAvailability}
          chartHeight={CHART_HEIGHT}
          canPredict={canPredict}
        />
      );
    }
    case GroupOfQuestionsGraphType.MultipleChoiceGraph: {
      const timestamps = getGroupQuestionsTimestamps(sortedQuestions, {
        withUserTimestamps: !!forecastAvailability.cpRevealsOn,
      });
      const choices = generateChoiceItemsFromGroupQuestions(sortedQuestions, {
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
          groupQuestions={questions}
          groupType={questionType}
          hideCP={hideCP}
          forecastAvailability={forecastAvailability}
          canPredict={canPredict}
        />
      );
    }
    default:
      return null;
  }
};

export default GroupContinuousTile;
