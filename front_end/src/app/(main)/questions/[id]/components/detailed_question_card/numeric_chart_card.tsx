"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import NumericChart from "@/components/charts/numeric_chart";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { Question } from "@/types/question";
import { getDisplayUserValue, getDisplayValue } from "@/utils/charts";

import CursorDetailItem from "./numeric_cursor_item";

type Props = {
  question: Question;
};

const NumericChartCard: FC<Props> = ({ question }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [isChartReady, setIsChartReady] = useState(false);

  const aggregate = question.aggregations.recency_weighted;

  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const cursorData = useMemo(() => {
    const index = aggregate.history.findIndex(
      (f) => f.start_time === cursorTimestamp
    );

    const forecast =
      index === -1
        ? aggregate.history[aggregate.history.length - 1]
        : aggregate.history[index];
    let timestamp = cursorTimestamp;
    const lastAggregate = aggregate.history[aggregate.history.length - 1];
    if (
      lastAggregate &&
      timestamp === null &&
      question.my_forecasts?.latest?.start_time &&
      lastAggregate.start_time < question.my_forecasts.latest.start_time
    ) {
      timestamp = question.my_forecasts.latest.start_time;
      return {
        timestamp,
        forecasterCount: forecast.forecaster_count,
        interval_lower_bound: forecast.interval_lower_bounds![0],
        center: forecast.centers![0],
        interval_upper_bound: forecast.interval_upper_bounds![0],
      };
    }
    return {
      timestamp: forecast.start_time ?? cursorTimestamp,
      forecasterCount: forecast.forecaster_count,
      interval_lower_bound: forecast.interval_lower_bounds![0],
      center: forecast.centers![0],
      interval_upper_bound: forecast.interval_upper_bounds![0],
    };
  }, [
    cursorTimestamp,
    aggregate.history,
    question.my_forecasts,
    question.aggregations.recency_weighted,
  ]);

  const handleCursorChange = useCallback((value: number | null) => {
    setCursorTimestamp(value);
  }, []);

  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  return (
    <div
      className={classNames(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      <NumericChart
        aggregations={question.aggregations}
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
          user ? TimelineChartZoomOption.All : TimelineChartZoomOption.TwoMonths
        }
        withZoomPicker
      />

      <div
        className={classNames(
          "my-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0",
          { "sm:grid-cols-3": !!question.my_forecasts?.history.length }
        )}
      >
        <CursorDetailItem
          title={t("totalForecastersLabel")}
          text={cursorData.forecasterCount?.toString()}
        />
        <CursorDetailItem
          title={t("communityPredictionLabel")}
          text={getDisplayValue(
            cursorData.center,
            question.type,
            question.scaling
          )}
          variant="prediction"
        />
        {!!question.my_forecasts?.history.length && (
          <CursorDetailItem
            title={t("myPrediction")}
            text={getDisplayUserValue(
              question.my_forecasts,
              cursorData.center,
              cursorData.timestamp,
              question.type,
              question.scaling
            )}
            variant="my-prediction"
          />
        )}
      </div>
    </div>
  );
};

export default NumericChartCard;
