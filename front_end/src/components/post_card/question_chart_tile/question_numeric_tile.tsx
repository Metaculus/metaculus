import { isNil, round } from "lodash";
import React, { FC, useCallback } from "react";

import { BINARY_FORECAST_PRECISION } from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import ContinuousAreaChart from "@/components/charts/continuous_area_chart";
import NumericChart from "@/components/charts/numeric_chart";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import useCardReaffirmContext from "@/components/post_card/reaffirm_context";
import PredictionChip from "@/components/prediction_chip";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, QuestionStatus } from "@/types/post";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithNumericForecasts,
  UserForecast,
} from "@/types/question";
import {
  getContinuousAreaChartData,
  getContinuousChartTypeFromQuestion,
} from "@/utils/charts";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts";

const HEIGHT = 100;

type Props = {
  question: QuestionWithNumericForecasts;
  curationStatus: PostStatus | QuestionStatus;
  defaultChartZoom?: TimelineChartZoomOption;
  hideCP?: boolean;
  forecasters?: number;
  forecastAvailability: ForecastAvailability;
  canPredict?: boolean;
};

const QuestionNumericTile: FC<Props> = ({
  question,
  curationStatus,
  defaultChartZoom,
  hideCP,
  forecasters,
  forecastAvailability,
  canPredict,
}) => {
  const { onReaffirm } = useCardReaffirmContext();

  const latest = question.aggregations.recency_weighted.latest;
  const continuousAreaChartData = getContinuousAreaChartData(
    latest,
    question.my_forecasts?.latest
  );

  // generate data to submit based on user forecast and question type
  const handleReaffirmClick = useCallback(
    (userForecast: UserForecast) => {
      if (!onReaffirm) return;

      switch (question.type) {
        case QuestionType.Binary: {
          const prevForecastValue = extractPrevBinaryForecastValue(
            userForecast.forecast_values[1]
          );
          if (isNil(prevForecastValue)) {
            return;
          }

          const forecastValue = round(
            prevForecastValue / 100,
            BINARY_FORECAST_PRECISION
          );

          onReaffirm([
            {
              questionId: question.id,
              forecastData: {
                continuousCdf: null,
                probabilityYes: forecastValue,
                probabilityYesPerCategory: null,
              },
            },
          ]);
          break;
        }
        case QuestionType.Numeric:
        case QuestionType.Date:
        case QuestionType.Discrete: {
          const activeForecast = isNil(userForecast.end_time)
            ? userForecast
            : undefined;

          if (!activeForecast) {
            return;
          }

          onReaffirm([
            {
              questionId: question.id,
              forecastData: {
                continuousCdf: activeForecast.forecast_values,
                probabilityYes: null,
                probabilityYesPerCategory: null,
              },
              distributionInput: activeForecast.distribution_input,
            },
          ]);
          break;
        }
      }
    },
    [onReaffirm, question.id, question.type]
  );

  return (
    <div className="flex justify-between">
      <div className="mr-3 inline-flex flex-col justify-center gap-0.5 text-xs font-semibold text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
        <PredictionChip
          question={question}
          status={curationStatus as PostStatus}
          showUserForecast
          hideCP={hideCP}
          onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
          canPredict={canPredict}
          showWeeklyMovement
          enforceCPDisplay
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
            unit={question.unit}
          />
        ) : (
          <ContinuousAreaChart
            scaling={question.scaling}
            data={continuousAreaChartData}
            height={HEIGHT}
            questionType={question.type}
            resolution={question.resolution}
            hideCP={hideCP}
            unit={question.unit}
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
