import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import PredictionChip from "@/components/prediction_chip";
import { PostStatus, PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  getFanOptionsFromNumericGroup,
  getGroupQuestionsTimestamps,
} from "@/utils/charts";
import {
  getPredictionQuestion,
  sortGroupPredictionOptions,
} from "@/utils/questions";
import ContinuousGroupTimeline from "@/app/(main)/questions/[id]/components/continuous_group_timeline";
import { FanOption } from "@/types/charts";

const CHART_HEIGHT = 100;

type Props = {
  questions: QuestionWithNumericForecasts[];
  curationStatus: PostStatus;
  post: PostWithForecasts;
};

const GroupNumericTile: FC<Props> = ({ questions, curationStatus, post }) => {
  let sortedQuestions;
  if (post.group_of_questions?.graph_type === "fan_graph") {
    sortedQuestions = getFanOptionsFromNumericGroup(questions);
  } else if (post.group_of_questions?.graph_type === "multiple_choice_graph") {
    sortedQuestions = sortGroupPredictionOptions(questions);
  }
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
            predictionQuestion.aggregations.recency_weighted.latest?.centers![0]
          }
          status={curationStatus}
        />
      </div>
      {post.group_of_questions!.graph_type === "fan_graph" ? (
        <FanChart
          options={sortedQuestions as FanOption[]}
          height={CHART_HEIGHT}
          pointSize={8}
        />
      ) : (
        <ContinuousGroupTimeline
          questions={sortedQuestions as QuestionWithNumericForecasts[]}
          timestamps={getGroupQuestionsTimestamps(
            sortedQuestions as QuestionWithNumericForecasts[]
          )}
          actualCloseTime={
            post.scheduled_close_time
              ? new Date(post.scheduled_close_time).getTime()
              : null
          }
          withLegand={false}
        />
      )}
    </div>
  );
};

export default GroupNumericTile;
