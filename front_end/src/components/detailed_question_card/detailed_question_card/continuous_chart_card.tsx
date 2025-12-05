"use client";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useCallback, useMemo, useState } from "react";

import { useIsEmbedMode } from "@/app/(embed)/questions/components/question_view_mode_context";
import QuestionHeaderCPStatus from "@/app/(main)/questions/[id]/components/question_view/forecaster_question_view/question_header/question_header_cp_status";
import NumericTimeline from "@/components/charts/numeric_timeline";
import QuestionPredictionTooltip from "@/components/charts/primitives/question_prediction_tooltip";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import {
  ForecastAvailability,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { getCursorForecast } from "@/utils/charts/cursor";
import cn from "@/utils/core/cn";
import { isForecastActive } from "@/utils/forecasts/helpers";
import {
  getDiscreteValueOptions,
  getPredictionDisplayValue,
  getUserPredictionDisplayValue,
} from "@/utils/formatters/prediction";
import {
  getPostDrivenTime,
  isContinuousQuestion,
} from "@/utils/questions/helpers";

type Props = {
  question: QuestionWithNumericForecasts;
  hideCP?: boolean;
  nrForecasters?: number;
  forecastAvailability?: ForecastAvailability;
  hideTitle?: boolean;
  isConsumerView?: boolean;
  embedChartHeight?: number;
};

const DetailedContinuousChartCard: FC<Props> = ({
  question,
  hideCP,
  nrForecasters,
  forecastAvailability,
  hideTitle,
  isConsumerView: isConsumerViewProp,
  embedChartHeight,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const isConsumerView = isConsumerViewProp ?? !user;
  const [isChartReady, setIsChartReady] = useState(false);

  const aggregation =
    question.aggregations[question.default_aggregation_method];
  const isCpHidden = !!forecastAvailability?.cpRevealsOn;

  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);

  const cursorData = useMemo(() => {
    if (isCpHidden) {
      return {
        timestamp:
          cursorTimestamp ?? question.my_forecasts?.latest?.start_time ?? null,
        forecasterCount: nrForecasters ?? 0,
        interval_lower_bound: null,
        center: null,
        interval_upper_bound: null,
      };
    }

    const forecast = getCursorForecast(cursorTimestamp, aggregation);
    let timestamp = cursorTimestamp;
    if (
      timestamp === null &&
      question.my_forecasts?.latest?.start_time &&
      isForecastActive(question.my_forecasts?.latest) &&
      forecast &&
      forecast.start_time < question.my_forecasts.latest.start_time
    ) {
      timestamp = question.my_forecasts.latest.start_time;
    } else {
      timestamp = forecast?.start_time ?? cursorTimestamp;
    }

    return {
      timestamp: timestamp,
      forecasterCount:
        // If there are no mouseover, we should display total forecasters number,
        // otherwise - only active during that period
        (cursorTimestamp ? forecast?.forecaster_count : nrForecasters) ?? 0,
      interval_lower_bound: forecast?.interval_lower_bounds?.[0] ?? null,
      center: forecast?.centers?.[0] ?? null,
      interval_upper_bound: forecast?.interval_upper_bounds?.[0] ?? null,
    };
  }, [
    isCpHidden,
    cursorTimestamp,
    aggregation,
    question.my_forecasts,
    nrForecasters,
  ]);

  const discreteValueOptions = getDiscreteValueOptions(question);

  const cpCursorElement = useMemo(() => {
    if (forecastAvailability?.isEmpty) {
      return t("noForecastsYet");
    }

    if (hideCP) {
      return "...";
    }

    const displayValue = getPredictionDisplayValue(cursorData?.center, {
      questionType: question.type,
      scaling: question.scaling,
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      discreteValueOptions,
    });
    return renderDisplayValue(displayValue);
  }, [
    t,
    cursorData,
    forecastAvailability,
    question.scaling,
    question.type,
    question.actual_resolve_time,
    question.unit,
    hideCP,
    discreteValueOptions,
  ]);

  const userCursorElement = useMemo(() => {
    if (!question.my_forecasts?.history.length) {
      return null;
    }
    const userDisplayValue = getUserPredictionDisplayValue({
      myForecasts: question.my_forecasts,
      timestamp: cursorData.timestamp,
      questionType: question.type,
      scaling: question.scaling,
      showRange: false,
      unit: question.unit,
      actual_resolve_time: question.actual_resolve_time ?? null,
      discreteValueOptions,
    });
    return renderDisplayValue(userDisplayValue);
  }, [
    question.my_forecasts,
    cursorData.timestamp,
    question.type,
    question.scaling,
    question.actual_resolve_time,
    question.unit,
    discreteValueOptions,
  ]);

  const handleCursorChange = useCallback((value: number | null) => {
    setCursorTimestamp(value);
  }, []);

  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const cursorTooltip = useMemo(() => {
    return (
      <QuestionPredictionTooltip
        communityPrediction={cpCursorElement}
        userPrediction={userCursorElement}
        totalForecasters={cursorData.forecasterCount}
        isConsumerView={isConsumerView}
        questionStatus={question.status}
      />
    );
  }, [
    cpCursorElement,
    userCursorElement,
    cursorData.forecasterCount,
    isConsumerView,
    question.status,
  ]);

  const isEmbed = useIsEmbedMode();

  const chartHeight = embedChartHeight ?? 150;

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      {!isConsumerView ? (
        <>
          {/* Large screens: side-by-side layout */}
          <div className="hidden items-stretch gap-4 md:flex">
            {isContinuousQuestion(question) && (
              <QuestionHeaderCPStatus
                question={question}
                size="lg"
                hideLabel={true}
              />
            )}
            <div className="relative flex-1">
              <NumericTimeline
                aggregation={
                  question.aggregations[question.default_aggregation_method]
                }
                myForecasts={question.my_forecasts}
                resolution={question.resolution}
                resolveTime={question.actual_resolve_time}
                cursorTimestamp={cursorTimestamp}
                onCursorChange={handleCursorChange}
                onChartReady={handleChartReady}
                questionType={question.type}
                questionStatus={question.status}
                actualCloseTime={getPostDrivenTime(question.actual_close_time)}
                scaling={question.scaling}
                defaultZoom={
                  user
                    ? TimelineChartZoomOption.All
                    : TimelineChartZoomOption.TwoMonths
                }
                withZoomPicker
                hideCP={hideCP || !!forecastAvailability?.cpRevealsOn}
                isEmptyDomain={
                  !!forecastAvailability?.isEmpty ||
                  !!forecastAvailability?.cpRevealsOn
                }
                openTime={getPostDrivenTime(question.open_time)}
                unit={question.unit}
                inboundOutcomeCount={question.inbound_outcome_count}
                simplifiedCursor={
                  question.type !== QuestionType.Binary || !user
                }
                title={hideTitle ? undefined : t("forecastTimelineHeading")}
                forecastAvailability={forecastAvailability}
                cursorTooltip={
                  question.type === QuestionType.Binary && !user
                    ? undefined
                    : cursorTooltip
                }
                isConsumerView={isConsumerView}
                isEmbedded={isEmbed}
                height={chartHeight}
              />
            </div>
          </div>

          {/* Small screens: timeline only (CP status shown in header) */}
          <div className="relative md:hidden">
            <NumericTimeline
              aggregation={
                question.aggregations[question.default_aggregation_method]
              }
              myForecasts={question.my_forecasts}
              resolution={question.resolution}
              resolveTime={question.actual_resolve_time}
              cursorTimestamp={cursorTimestamp}
              onCursorChange={handleCursorChange}
              onChartReady={handleChartReady}
              questionType={question.type}
              questionStatus={question.status}
              actualCloseTime={getPostDrivenTime(question.actual_close_time)}
              scaling={question.scaling}
              defaultZoom={
                user
                  ? TimelineChartZoomOption.All
                  : TimelineChartZoomOption.TwoMonths
              }
              withZoomPicker
              hideCP={hideCP || !!forecastAvailability?.cpRevealsOn}
              isEmptyDomain={
                !!forecastAvailability?.isEmpty ||
                !!forecastAvailability?.cpRevealsOn
              }
              openTime={getPostDrivenTime(question.open_time)}
              unit={question.unit}
              inboundOutcomeCount={question.inbound_outcome_count}
              simplifiedCursor={question.type !== QuestionType.Binary || !user}
              title={hideTitle ? undefined : t("forecastTimelineHeading")}
              forecastAvailability={forecastAvailability}
              cursorTooltip={
                question.type === QuestionType.Binary && !user
                  ? undefined
                  : cursorTooltip
              }
              isConsumerView={isConsumerView}
              isEmbedded={isEmbed}
              height={chartHeight}
            />
          </div>
        </>
      ) : (
        <div className="relative">
          <NumericTimeline
            aggregation={
              question.aggregations[question.default_aggregation_method]
            }
            myForecasts={question.my_forecasts}
            resolution={question.resolution}
            resolveTime={question.actual_resolve_time}
            cursorTimestamp={cursorTimestamp}
            onCursorChange={handleCursorChange}
            onChartReady={handleChartReady}
            questionType={question.type}
            questionStatus={question.status}
            actualCloseTime={getPostDrivenTime(question.actual_close_time)}
            scaling={question.scaling}
            defaultZoom={
              user
                ? TimelineChartZoomOption.All
                : TimelineChartZoomOption.TwoMonths
            }
            withZoomPicker
            hideCP={hideCP || !!forecastAvailability?.cpRevealsOn}
            isEmptyDomain={
              !!forecastAvailability?.isEmpty ||
              !!forecastAvailability?.cpRevealsOn
            }
            openTime={getPostDrivenTime(question.open_time)}
            unit={question.unit}
            inboundOutcomeCount={question.inbound_outcome_count}
            simplifiedCursor={question.type !== QuestionType.Binary || !user}
            title={hideTitle ? undefined : t("forecastTimelineHeading")}
            forecastAvailability={forecastAvailability}
            cursorTooltip={
              question.type === QuestionType.Binary && !user
                ? undefined
                : cursorTooltip
            }
            isConsumerView={isConsumerView}
            isEmbedded={isEmbed}
            height={chartHeight}
          />
        </div>
      )}
    </div>
  );
};

function renderDisplayValue(displayValue: string): ReactNode {
  const displayValueChunks = displayValue.split("\n");
  if (displayValueChunks.length > 1) {
    const [centerLabel, intervalLabel] = displayValueChunks;
    return (
      <>
        <div>{centerLabel}</div>
        {!isNil(intervalLabel) && (
          <div className="text-xs font-medium">{intervalLabel}</div>
        )}
      </>
    );
  }
  return displayValue;
}

export default DetailedContinuousChartCard;
