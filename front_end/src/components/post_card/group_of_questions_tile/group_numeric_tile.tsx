import { FC } from "react";

import FanChart from "@/components/charts/fan_chart";
import PredictionChip from "@/components/prediction_chip";
import { PostStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getFanOptionsFromNumericGroup } from "@/utils/charts";
import { getPredictionQuestion } from "@/utils/questions";

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
          question={predictionQuestion}
          prediction={
            predictionQuestion.aggregations.recency_weighted.latest?.centers![0]
          }
          status={curationStatus}
        />
      </div>
      <FanChart
        options={getFanOptionsFromNumericGroup(questions)}
        height={CHART_HEIGHT}
        pointSize={8}
      />
    </div>
  );
};

export default GroupNumericTile;
