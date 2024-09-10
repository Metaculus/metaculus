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
import { cdfToPmf } from "@/utils/math";

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
  const latest = question.aggregations.recency_weighted.latest;
  const prediction = latest?.centers![0];

  const prevForecast = question.my_forecasts?.latest?.slider_values;
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

  const continuousAreaChartData = [];
  if (latest) {
    continuousAreaChartData.push({
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type: "community" as ContinuousAreaType,
    });
  }

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
          showUserForecast
        />
      </div>
      <div className="my-1 h-24 w-2/3 min-w-24 max-w-[500px] flex-1 overflow-visible">
        {question.type === QuestionType.Binary ? (
          <NumericChart
            aggregations={question.aggregations}
            myForecasts={question.my_forecasts}
            height={HEIGHT}
            questionType={
              getNumericChartTypeFromQuestion(question.type) ??
              QuestionType.Numeric
            }
            actualCloseTime={
              question.actual_close_time
                ? new Date(question.actual_close_time).getTime()
                : null
            }
            scaling={question.scaling}
            defaultZoom={defaultChartZoom}
            resolution={question.resolution}
          />
        ) : (
          <ContinuousAreaChart
            scaling={question.scaling}
            data={continuousAreaChartData}
            height={HEIGHT}
            questionType={question.type}
          />
        )}
      </div>
    </div>
  );
};

export default QuestionNumericTile;
