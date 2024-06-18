import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import PredictionChip from "@/components/prediction_chip";
import { PostStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getFanName, getFanOptionsFromNumericGroup } from "@/utils/charts";

const CHART_HEIGHT = 100;

type Props = {
  questions: QuestionWithNumericForecasts[];
  curationStatus: PostStatus;
};

const GroupNumericTile: FC<Props> = ({ questions, curationStatus }) => {
  const predictionQuestion = getPredictionQuestion(questions, curationStatus);

  return (
    <div className="flex justify-between">
      <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
        <span className="whitespace-nowrap text-base text-olive-800 dark:text-olive-800-dark">
          {predictionQuestion.fanName}:
        </span>
        <PredictionChip
          prediction={predictionQuestion.forecasts.values_mean.at(-1)}
          resolution={predictionQuestion.resolution}
          nr_forecasters={predictionQuestion.nr_forecasters}
          status={curationStatus}
          questionType={predictionQuestion.type}
        />
      </div>
      <FanChart
        options={getFanOptionsFromNumericGroup(questions)}
        height={CHART_HEIGHT}
      />
    </div>
  );
};

function getPredictionQuestion(
  questions: QuestionWithNumericForecasts[],
  curationStatus: PostStatus
) {
  const sortedQuestions = questions
    .map((q, index) => {
      const fanName = getFanName(q.title);
      const dateValue = Date.parse(fanName);
      const sortValue = isNaN(dateValue) ? index : dateValue;
      return { ...q, sortValue, fanName };
    })
    .sort((a, b) => a.sortValue - b.sortValue);

  if (curationStatus === PostStatus.RESOLVED) {
    return sortedQuestions[sortedQuestions.length - 1];
  }

  return (
    sortedQuestions.find((q) => q.resolution === null) ??
    sortedQuestions[sortedQuestions.length - 1]
  );
}

export default GroupNumericTile;
