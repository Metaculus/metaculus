import React, { FC } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import NumericChart from "@/components/charts/numeric_chart";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import PredictionChip from "@/components/prediction_chip";
import { ContinuousAreaType, TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, QuestionStatus } from "@/types/post";
import {
  QuestionWithNumericForecasts,
  QuestionType,
  ForecastAvailability,
} from "@/types/question";
import { getContinuousChartTypeFromQuestion } from "@/utils/charts";
import { cdfToPmf } from "@/utils/math";

const HEIGHT = 100;

type Props = {
  question: QuestionWithNumericForecasts;
  curationStatus: PostStatus | QuestionStatus;
  defaultChartZoom?: TimelineChartZoomOption;
  hideCP?: boolean;
  forecasters?: number;
  forecastAvailability: ForecastAvailability;
};

const QuestionNumericTile: FC<Props> = ({
  question,
  curationStatus,
  defaultChartZoom,
  hideCP,
  forecasters,
  forecastAvailability,
}) => {
  const latest = question.aggregations.recency_weighted.latest;
  const prediction = latest?.centers?.[0];

  const continuousAreaChartData = [];
  if (latest && !latest.end_time) {
    continuousAreaChartData.push({
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type: "community" as ContinuousAreaType,
    });
  }

  const userForecast = question.my_forecasts?.latest;
  if (!!userForecast && !userForecast.end_time) {
    continuousAreaChartData.push({
      pmf: cdfToPmf(userForecast.forecast_values),
      cdf: userForecast.forecast_values,
      type: "user" as ContinuousAreaType,
    });
  }

  return (
    <div className="flex justify-between">
      <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
        <PredictionChip
          question={question}
          prediction={prediction}
          status={curationStatus as PostStatus}
          showUserForecast
          hideCP={hideCP}
        />

        <ForecastersCounter forecasters={forecasters} className="p-1" />
      </div>
      <div className="relative my-1 h-24 w-2/3 min-w-24 max-w-[500px] flex-1 overflow-visible">
        {question.type === QuestionType.Binary ? (
          <NumericChart
            aggregation={question.aggregations.recency_weighted}
            myForecasts={question.my_forecasts}
            height={HEIGHT}
            questionType={
              getContinuousChartTypeFromQuestion(question.type) ??
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
            resolveTime={question.actual_resolve_time}
            hideCP={hideCP}
            withUserForecastTimestamps={!forecastAvailability.cpRevealsOn}
            isEmptyDomain={
              !!forecastAvailability?.isEmpty ||
              !!forecastAvailability?.cpRevealsOn
            }
            openTime={
              question.open_time
                ? new Date(question.open_time).getTime()
                : undefined
            }
          />
        ) : (
          <ContinuousAreaChart
            scaling={question.scaling}
            data={continuousAreaChartData}
            height={HEIGHT}
            questionType={question.type}
            resolution={question.resolution}
            hideCP={hideCP}
          />
        )}

        <ForecastAvailabilityChartOverflow
          forecastAvailability={forecastAvailability}
          className="pl-3 text-xs md:text-sm"
        />
      </div>
    </div>
  );
};

export default QuestionNumericTile;
