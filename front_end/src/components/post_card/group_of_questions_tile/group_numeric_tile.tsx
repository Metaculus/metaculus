import { useLocale } from "next-intl";
import { FC } from "react";

import NumericGroupChart from "@/app/(main)/questions/[id]/components/detailed_group_card/numeric_group_chart";
import MultipleChoiceTile from "@/components/multiple_choice_tile";
import PredictionChip from "@/components/prediction_chip";
import { useAuth } from "@/contexts/auth_context";
import {
  GroupOfQuestionsGraphType,
  TimelineChartZoomOption,
} from "@/types/charts";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromBinaryGroup,
  getContinuousGroupScaling,
  getGroupQuestionsTimestamps,
} from "@/utils/charts";
import {
  generateUserForecasts,
  getPredictionQuestion,
  sortGroupPredictionOptions,
} from "@/utils/questions";

const CHART_HEIGHT = 100;

type Props = {
  questions: QuestionWithNumericForecasts[];
  curationStatus: PostStatus;
  post: PostWithForecasts;
  hideCP?: boolean;
};

const GroupNumericTile: FC<Props> = ({
  questions,
  curationStatus,
  post,
  hideCP,
}) => {
  const { user } = useAuth();
  const locale = useLocale();
  const isBinaryGroup = questions[0].type === QuestionType.Binary;
  const scaling = isBinaryGroup
    ? undefined
    : getContinuousGroupScaling(questions);

  if (
    post.group_of_questions?.graph_type === GroupOfQuestionsGraphType.FanGraph
  ) {
    const predictionQuestion = getPredictionQuestion(questions, curationStatus);
    return (
      <div className="flex justify-between">
        <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
          <span className="whitespace-nowrap text-base text-olive-800 dark:text-olive-800-dark">
            {predictionQuestion.fanName}:
          </span>
          <PredictionChip
            question={predictionQuestion}
            prediction={
              predictionQuestion.aggregations.recency_weighted.latest
                ?.centers![0]
            }
            status={curationStatus}
            hideCP={hideCP}
          />
        </div>
        <div className="my-1 h-24 w-2/3 min-w-24 max-w-[500px] flex-1 overflow-visible">
          <NumericGroupChart
            questions={questions}
            height={CHART_HEIGHT}
            pointSize={8}
            hideCP={hideCP}
          />
        </div>
      </div>
    );
  } else if (
    post.group_of_questions?.graph_type ===
    GroupOfQuestionsGraphType.MultipleChoiceGraph
  ) {
    const visibleChoicesCount = 3;
    const sortedQuestions = sortGroupPredictionOptions(questions);
    const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
    const choices = generateChoiceItemsFromBinaryGroup(questions, {
      withMinMax: true,
      activeCount: visibleChoicesCount,
      locale,
    });
    const actualCloseTime = post.actual_close_time
      ? new Date(post.actual_close_time).getTime()
      : null;
    return (
      <MultipleChoiceTile
        choices={choices}
        timestamps={timestamps}
        actualCloseTime={actualCloseTime}
        visibleChoicesCount={visibleChoicesCount}
        defaultChartZoom={
          user ? TimelineChartZoomOption.All : TimelineChartZoomOption.TwoMonths
        }
        scaling={scaling}
        userForecasts={
          user
            ? generateUserForecasts(
                sortedQuestions as QuestionWithNumericForecasts[]
              )
            : undefined
        }
        questionType={questions[0].type}
        hideCP={hideCP}
      />
    );
  }
};

export default GroupNumericTile;
