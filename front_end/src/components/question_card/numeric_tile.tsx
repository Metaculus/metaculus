import { FC } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import PredictionChip from "@/components/prediction_chip";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";

const HEIGHT = 100;

type Props = {
  question: QuestionWithNumericForecasts;
};

const NumericTile: FC<Props> = ({ question }) => {
  const prediction =
    question.forecasts.values_mean[question.forecasts.values_mean.length - 1];

  return (
    <div className="flex justify-between">
      <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
        <PredictionChip
          prediction={prediction}
          resolution={question.resolution}
          nr_forecasters={question.nr_forecasters}
          status={question.status}
          questionType={question.type}
        />
      </div>
      <div className="my-1 w-2/3 min-w-24 max-w-[500px] flex-1 overflow-visible">
        <NumericChart
          dataset={question.forecasts}
          height={HEIGHT}
          binary={question.type === QuestionType.Binary}
        />
      </div>
    </div>
  );
};

export default NumericTile;
