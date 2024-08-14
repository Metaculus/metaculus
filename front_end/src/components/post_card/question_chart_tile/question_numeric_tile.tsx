import { FC, useMemo } from "react";

import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import NumericChart from "@/components/charts/numeric_chart";
import PredictionChip from "@/components/prediction_chip";
import { ContinuousAreaType, TimelineChartZoomOption } from "@/types/charts";
import { PostStatus } from "@/types/post";
import { QuestionWithNumericForecasts, QuestionType } from "@/types/question";
import { getNumericChartTypeFromQuestion } from "@/utils/charts";
import {
  extractPrevNumericForecastValue,
  getNumericForecastDataset,
} from "@/utils/forecasts";

const HEIGHT = 100;

type Props = {
  question: QuestionWithNumericForecasts;
  curationStatus: PostStatus;
  defaultChartZoom?: TimelineChartZoomOption;
};

const QuestionNumericTile: FC<Props> = ({
  question,
  curationStatus,
  defaultChartZoom,
}) => {
  const prediction =
    question.forecasts.medians[question.forecasts.medians.length - 1];

  const prevForecast = question.forecasts.my_forecasts?.slider_values;
  const prevForecastValue = extractPrevNumericForecastValue(prevForecast);
  const dataset = useMemo(
    () =>
      prevForecastValue?.forecast && prevForecastValue?.weights
        ? getNumericForecastDataset(
            prevForecastValue.forecast,
            prevForecastValue.weights,
            question.open_lower_bound!,
            question.open_upper_bound!
          )
        : null,
    [question.open_lower_bound, question.open_upper_bound]
  );

  const continuousAreaChartData = [
    {
      pmf: question.forecasts.latest_pmf,
      cdf: question.forecasts.latest_cdf,
      type: "community" as ContinuousAreaType,
    },
  ];

  if (!!dataset) {
    continuousAreaChartData.push({
      pmf: dataset.pmf,
      cdf: dataset.cdf,
      type: "user" as ContinuousAreaType,
    });
  }

  return (
    <div className="flex justify-between">
      <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
        <PredictionChip
          question={question}
          prediction={prediction}
          status={curationStatus}
        />
      </div>
      <div className="my-1 h-24 w-2/3 min-w-24 max-w-[500px] flex-1 overflow-visible">
        {question.type === QuestionType.Binary ? (
          <NumericChart
            dataset={question.forecasts}
            height={HEIGHT}
            questionType={
              getNumericChartTypeFromQuestion(question.type) ??
              QuestionType.Numeric
            }
            rangeMin={question.range_min}
            rangeMax={question.range_max}
            zeroPoint={question.zero_point}
            defaultZoom={defaultChartZoom}
            resolution={question.resolution}
            derivRatio={question.possibilities.scale?.deriv_ratio}
          />
        ) : (
          <ContinuousAreaChart
            rangeMin={question.range_min!}
            rangeMax={question.range_max!}
            zeroPoint={question.zero_point}
            data={continuousAreaChartData}
            height={HEIGHT}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionNumericTile;
