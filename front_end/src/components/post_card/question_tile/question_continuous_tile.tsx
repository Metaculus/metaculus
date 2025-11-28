import { isNil, round } from "lodash";
import React, { FC, useCallback } from "react";

import ContinuousAreaChart, {
  getContinuousAreaChartData,
} from "@/components/charts/continuous_area_chart";
import NumericTimeline from "@/components/charts/numeric_timeline";
import { QuestionResolutionChipFacade } from "@/components/consumer_post_card/question_resolution_chip";
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
import { QuestionStatus } from "@/types/post";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithNumericForecasts,
  UserForecast,
} from "@/types/question";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";
import { getPostDrivenTime } from "@/utils/questions/helpers";

const HEIGHT = 90;

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
    isClosed: question.status === QuestionStatus.CLOSED,
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
                continuousCdf: activeForecast.forecast_values.map((v) => {
                  if (v === null) {
                    throw new Error("Forecast values contain null values");
                  }
                  return v;
                }),
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
    [onReaffirm, question, user?.prediction_expiration_percent]
  );

  // Binary questions use original side-by-side layout
  if (question.type === QuestionType.Binary) {
    return (
      <div className="flex min-h-24 justify-between gap-6">
        <div className="inline-flex flex-col justify-center gap-3 text-xs text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
          <PredictionBinaryInfo
            question={question}
            onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
            canPredict={canPredict}
            cpMovementClassName="max-w-[110px]"
            showMyPrediction={true}
            renderResolutionStatus={(q) => (
              <QuestionResolutionChipFacade question={q} size="sm" />
            )}
          />
        </div>
        {showChart && (
          <div className="relative min-h-12 w-2/3 min-w-24 flex-1 overflow-visible">
            <NumericTimeline
              nonInteractive={true}
              aggregation={
                question.aggregations[question.default_aggregation_method]
              }
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
              questionStatus={question.status}
              forecastAvailability={forecastAvailability}
              forFeedPage
            />
          </div>
        )}
      </div>
    );
  }

  // Continuous questions (Numeric, Discrete, Date) use overlay layout

  // Check if we should use overlay layout or regular layout
  const isResolved =
    question.status === QuestionStatus.RESOLVED && question.resolution;
  const shouldUseOverlayLayout =
    !isResolved &&
    !forecastAvailability.isEmpty &&
    !forecastAvailability.cpRevealsOn;

  if (shouldUseOverlayLayout) {
    // Use overlay layout for mobile, side-by-side for large screens
    return (
      <div className="w-full">
        {/* Mobile: Overlay layout */}
        <div className="flex flex-col items-center md:hidden">
          {/* CP values container - positioned first */}
          <div className="relative z-20 flex w-full items-stretch justify-stretch md:items-center md:justify-center">
            <div className="flex w-full flex-col justify-center gap-3 text-xs text-gray-600 dark:text-gray-600-dark">
              <PredictionContinuousInfo
                question={question}
                onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
                canPredict={canPredict}
                showMyPrediction={true}
              />
            </div>
          </div>

          {/* Full-width chart background - overlapping with negative margin */}
          {showChart && (
            <div className="relative z-10 -mt-8 flex w-full flex-col overflow-visible">
              <ContinuousAreaChart
                data={continuousAreaChartData}
                height={HEIGHT}
                question={question}
                hideCP={hideCP}
                forceTickCount={3}
              />
              <ForecastAvailabilityChartOverflow
                forecastAvailability={forecastAvailability}
                className="pl-3 text-xs md:text-sm"
              />
            </div>
          )}
        </div>

        {/* Large screens: Side-by-side layout (like binary questions) */}
        <div className="hidden justify-between gap-6 md:flex">
          <div className="inline-flex flex-col justify-center gap-3 text-xs text-gray-600 dark:text-gray-600-dark xs:max-w-[650px]">
            <PredictionContinuousInfo
              question={question}
              onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
              canPredict={canPredict}
              showMyPrediction={true}
            />
          </div>
          {showChart && (
            <div className="relative h-24 w-2/3 min-w-24 flex-1 overflow-visible">
              <ContinuousAreaChart
                data={continuousAreaChartData}
                height={HEIGHT}
                question={question}
                hideCP={hideCP}
                forceTickCount={3}
              />
              <ForecastAvailabilityChartOverflow
                forecastAvailability={forecastAvailability}
                className="pl-3 text-xs md:text-sm"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Use regular layout for resolved questions, no forecasts, or CP not revealed
  return (
    <div className="flex flex-col">
      {/* CP values container - regular positioning */}
      <div className="flex justify-center">
        <div className="inline-flex flex-col justify-center gap-3 text-xs text-gray-600 dark:text-gray-600-dark">
          <PredictionContinuousInfo
            question={question}
            onReaffirm={onReaffirm ? handleReaffirmClick : undefined}
            canPredict={canPredict}
            showMyPrediction={true}
          />
        </div>
      </div>

      {/* Chart below CP values */}
      {showChart && (
        <div className="relative w-full overflow-visible">
          <ContinuousAreaChart
            data={continuousAreaChartData}
            height={HEIGHT}
            question={question}
            hideCP={hideCP}
            forceTickCount={3}
          />
          <ForecastAvailabilityChartOverflow
            forecastAvailability={forecastAvailability}
            className="pl-3 text-xs text-gray-700 dark:text-gray-700-dark md:text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default QuestionContinuousTile;
