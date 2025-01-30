"use client";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import CPRevealTime from "@/components/cp_reveal_time";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { ForecastAvailability, Question } from "@/types/question";
import {
  getUserPredictionDisplayValue,
  getDisplayValue,
  getCursorForecast,
} from "@/utils/charts";
import cn from "@/utils/cn";

import CursorDetailItem from "./numeric_cursor_item";

type Props = {
  question: Question;
  hideCP?: boolean;
  nrForecasters?: number;
  forecastAvailability?: ForecastAvailability;
};

const DetailedContinuousChartCard: FC<Props> = ({
  question,
  hideCP,
  nrForecasters,
  forecastAvailability,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [isChartReady, setIsChartReady] = useState(false);

  const aggregation = question.aggregations.recency_weighted;

  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);

  const cursorData = useMemo(() => {
    if (!!forecastAvailability?.cpRevealsOn) {
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
      !question.my_forecasts?.latest?.end_time &&
      forecast &&
      forecast.start_time < question.my_forecasts.latest.start_time
    ) {
      timestamp = question.my_forecasts.latest.start_time;
      const forecasterCount = !!forecastAvailability?.cpRevealsOn
        ? forecast?.forecaster_count ?? 0
        : nrForecasters ?? 0;

      return {
        timestamp,
        forecasterCount,
        interval_lower_bound: forecast?.interval_lower_bounds?.[0] ?? null,
        center: forecast?.centers?.[0] ?? null,
        interval_upper_bound: forecast?.interval_upper_bounds?.[0] ?? null,
      };
    }

    return {
      timestamp: forecast?.start_time ?? cursorTimestamp,
      forecasterCount: forecast?.forecaster_count ?? 0,
      interval_lower_bound: forecast?.interval_lower_bounds?.[0] ?? null,
      center: forecast?.centers?.[0] ?? null,
      interval_upper_bound: forecast?.interval_upper_bounds?.[0] ?? null,
    };
  }, [
    cursorTimestamp,
    aggregation,
    question.my_forecasts,
    nrForecasters,
    forecastAvailability,
  ]);

  const cpCursorElement = useMemo(() => {
    if (forecastAvailability?.cpRevealsOn) {
      return <CPRevealTime cpRevealTime={forecastAvailability.cpRevealsOn} />;
    }

    if (forecastAvailability?.isEmpty) {
      return t("noForecastsYet");
    }

    if (hideCP) {
      return "...";
    }

    return getDisplayValue({
      value: cursorData?.center,
      questionType: question.type,
      scaling: question.scaling,
      range: cursorData?.interval_lower_bound
        ? [
            cursorData?.interval_lower_bound as number,
            cursorData?.interval_upper_bound as number,
          ]
        : [],
    });
  }, [
    t,
    cursorData,
    forecastAvailability,
    question.scaling,
    question.type,
    hideCP,
  ]);

  const handleCursorChange = useCallback((value: number | null) => {
    setCursorTimestamp(value);
  }, []);

  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <div className="relative">
        <NumericChart
          aggregation={question.aggregations.recency_weighted}
          myForecasts={question.my_forecasts}
          resolution={question.resolution}
          resolveTime={question.actual_resolve_time}
          onCursorChange={handleCursorChange}
          yLabel={t("communityPredictionLabel")}
          onChartReady={handleChartReady}
          questionType={question.type}
          actualCloseTime={
            question.actual_close_time
              ? new Date(question.actual_close_time).getTime()
              : null
          }
          scaling={question.scaling}
          defaultZoom={
            user
              ? TimelineChartZoomOption.All
              : TimelineChartZoomOption.TwoMonths
          }
          withZoomPicker
          hideCP={hideCP || !!forecastAvailability?.cpRevealsOn}
          withUserForecastTimestamps={!!forecastAvailability?.cpRevealsOn}
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
      </div>
      <div
        className={cn(
          "my-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0",
          { "sm:grid-cols-3": !!question.my_forecasts?.history.length }
        )}
      >
        <CursorDetailItem
          title={t("totalForecastersLabel")}
          content={cursorData.forecasterCount.toString()}
        />
        <CursorDetailItem
          title={t("communityPredictionLabel")}
          content={cpCursorElement}
          variant="prediction"
        />
        {!!question.my_forecasts?.history.length && (
          <CursorDetailItem
            title={t("myPrediction")}
            content={getUserPredictionDisplayValue(
              question.my_forecasts,
              cursorData.timestamp,
              question.type,
              question.scaling,
              true
            )}
            variant="my-prediction"
          />
        )}
      </div>
    </div>
  );
};

export default DetailedContinuousChartCard;
