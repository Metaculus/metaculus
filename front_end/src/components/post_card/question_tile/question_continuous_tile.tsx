import { isNil, round } from "lodash";
import React, { FC, useCallback } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import ContinuousAreaChart, {
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import NumericTimeline from "@/components/charts/numeric_timeline";
import { BINARY_FORECAST_PRECISION } from "@/components/forecast_maker/binary_slider";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import useCardReaffirmContext from "@/components/post_card/reaffirm_context";
import PredictionChip from "@/components/prediction_chip";
import { useHideCP } from "@/contexts/cp_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { PostStatus, QuestionStatus } from "@/types/post";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithNumericForecasts,
  UserForecast,
} from "@/types/question";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";
import { getPostDrivenTime } from "@/utils/questions/helpers";
import {
  buildDefaultForecastExpiration,
  forecastExpirationToDate,
} from "@/components/forecast_maker/forecast_expiration";
import { useAuth } from "@/contexts/auth_context";

const HEIGHT = 100;

type Props = {
  question: QuestionWithNumericForecasts;
  curationStatus: PostStatus | QuestionStatus;
  defaultChartZoom?: TimelineChartZoomOption;
  forecasters?: number;
  forecastAvailability: ForecastAvailability;
  canPredict?: boolean;
};

const QuestionContinuousTile: FC<Props> = ({
  question,
  curationStatus,
  defaultChartZoom,
  forecasters,
  forecastAvailability,
  canPredict,
}) => {
  const { onReaffirm } = useCardReaffirmContext();

  const { hideCP } = useHideCP();
  const { user } = useAuth();

  const continuousAreaChartData = getContinuousAreaChartData({
    question,
  });

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

          const forecastExpiration = buildDefaultForecastExpiration(
            question,
            user?.prediction_expiration_percent ?? undefined
          );
          onReaffirm([
            {
              questionId: question.id,
              forecastEndTime: forecastExpirationToDate(forecastExpiration),
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
        case QuestionType.Discrete:
        case QuestionType.Date: {
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
          <NumericTimeline
            nonInteractive={true}
            aggregation={question.aggregations.recency_weighted}
            myForecasts={question.my_forecasts}
            height={HEIGHT}
            questionType={question.type}
            actualCloseTime={getPostDrivenTime(question.actual_close_time)}
            scaling={question.scaling}
            defaultZoom={defaultChartZoom}
            resolution={question.resolution}
            resolveTime={question.actual_resolve_time}
            hideCP={hideCP}
            isEmptyDomain={
              !!forecastAvailability?.isEmpty ||
              !!forecastAvailability?.cpRevealsOn
            }
            openTime={getPostDrivenTime(question.open_time)}
            unit={question.unit}
            tickFontSize={9}
          />
        ) : (
          <ContinuousAreaChart
            data={continuousAreaChartData}
            height={HEIGHT}
            question={question}
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

export default QuestionContinuousTile;
