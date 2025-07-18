import { isNil, round } from "lodash";
import React, { FC, useCallback } from "react";

import ContinuousAreaChart, {
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import NumericTimeline from "@/components/charts/numeric_timeline";
import { BINARY_FORECAST_PRECISION } from "@/components/forecast_maker/binary_slider";
import {
  buildDefaultForecastExpiration,
  forecastExpirationToDate,
} from "@/components/forecast_maker/forecast_expiration";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import PredictionBinaryInfo from "@/components/post_card/question_tile/prediction_binary_info";
import PredictionContinuousInfo from "@/components/post_card/question_tile/prediction_continuous_info";
import useCardReaffirmContext from "@/components/post_card/reaffirm_context";
import { useAuth } from "@/contexts/auth_context";
import { useHideCP } from "@/contexts/cp_context";
import { TimelineChartZoomOption } from "@/types/charts";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithNumericForecasts,
  UserForecast,
} from "@/types/question";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";
import { getPostDrivenTime } from "@/utils/questions/helpers";

const HEIGHT = 100;

type Props = {
  question: QuestionWithNumericForecasts;
  defaultChartZoom?: TimelineChartZoomOption;
  forecastAvailability: ForecastAvailability;
  canPredict?: boolean;
  showChart?: boolean;
};

const QuestionContinuousTile: FC<Props> = ({
  question,
  defaultChartZoom,
  forecastAvailability,
  canPredict,
  showChart = true,
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
          const activeForecast = isForecastActive(userForecast)
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
    <div className="flex justify-between gap-6 md:gap-8">
      <div className="inline-flex flex-col justify-center gap-3 text-xs text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
        {question.type === QuestionType.Binary && (
          <PredictionBinaryInfo
            question={question}
            onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
            canPredict={canPredict}
          />
        )}
        {[
          QuestionType.Numeric,
          QuestionType.Discrete,
          QuestionType.Date,
        ].includes(question.type) && (
          <PredictionContinuousInfo
            question={question}
            onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
            canPredict={canPredict}
          />
        )}
      </div>
      {showChart && (
        <div className="relative h-24 w-2/3 min-w-24 flex-1 overflow-visible">
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
      )}
    </div>
  );
};

export default QuestionContinuousTile;
