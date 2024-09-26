import { useLocale } from "next-intl";
import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import MultipleChoiceTile from "@/components/multiple_choice_tile";
import PredictionChip from "@/components/prediction_chip";
import { useAuth } from "@/contexts/auth_context";
import { FanOption, TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  generateChoiceItemsFromBinaryGroup,
  getFanOptionsFromNumericGroup,
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
};

const GroupNumericTile: FC<Props> = ({ questions, curationStatus, post }) => {
  const { user } = useAuth();
  const locale = useLocale();

  if (post.group_of_questions?.graph_type === "fan_graph") {
    const sortedQuestions = getFanOptionsFromNumericGroup(questions);
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
          />
        </div>

        <FanChart
          options={sortedQuestions as FanOption[]}
          height={CHART_HEIGHT}
          pointSize={8}
        />
      </div>
    );
  } else if (post.group_of_questions?.graph_type === "multiple_choice_graph") {
    const visibleChoicesCount = 3;
    const sortedQuestions = sortGroupPredictionOptions(questions);
    const timestamps = getGroupQuestionsTimestamps(sortedQuestions);
    const choices = generateChoiceItemsFromBinaryGroup(questions, {
      withMinMax: true,
      activeCount: visibleChoicesCount,
      locale,
    });
    return (
      <MultipleChoiceTile
        choices={choices}
        timestamps={timestamps}
        visibleChoicesCount={visibleChoicesCount}
        defaultChartZoom={
          user ? TimelineChartZoomOption.All : TimelineChartZoomOption.TwoMonths
        }
        userForecasts={
          user
            ? generateUserForecasts(
                sortedQuestions as QuestionWithNumericForecasts[]
              )
            : undefined
        }
      />
    );
  }
};

export default GroupNumericTile;
