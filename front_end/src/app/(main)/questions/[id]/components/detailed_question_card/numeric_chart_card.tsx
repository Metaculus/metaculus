"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useMemo, useState } from "react";

import CPRevealTime from "@/components/charts/cp_reveal_time";
import NumericChart from "@/components/charts/numeric_chart";
import { useAuth } from "@/contexts/auth_context";
import { TimelineChartZoomOption } from "@/types/charts";
import { Question } from "@/types/question";
import { getDisplayUserValue, getDisplayValue } from "@/utils/charts";

import CursorDetailItem from "./numeric_cursor_item";

type Props = {
  question: Question;
  hideCP?: boolean;
  isCPRevealed?: boolean;
  nrForecasters?: number;
};

const NumericChartCard: FC<Props> = ({
  question,
  hideCP,
  isCPRevealed,
  nrForecasters,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [isChartReady, setIsChartReady] = useState(false);

  const aggregate = question.aggregations.recency_weighted;

  const [cursorTimestamp, setCursorTimestamp] = useState<number | null>(null);
  const cursorData = useMemo(() => {
    if (!isCPRevealed) {
      return {
        timestamp: cursorTimestamp,
        forecasterCount: nrForecasters ?? 0,
        interval_lower_bound: null,
        center: null,
        interval_upper_bound: null,
      };
    }

    const latest = aggregate.latest;
    const index =
      cursorTimestamp === null
        ? latest && !latest.end_time
          ? aggregate.history.length - 1
          : -1
        : cursorTimestamp === undefined
          ? -1
          : aggregate.history.findIndex(
              (f) =>
                cursorTimestamp !== null &&
                f.start_time <= cursorTimestamp &&
                (f.end_time === null || f.end_time > cursorTimestamp)
            );

    const forecast = index === -1 ? null : aggregate.history[index];
    let timestamp = cursorTimestamp;
    if (
      timestamp === null &&
      question.my_forecasts?.latest?.start_time &&
      !question.my_forecasts?.latest?.end_time &&
      forecast &&
      forecast.start_time < question.my_forecasts.latest.start_time
    ) {
      timestamp = question.my_forecasts.latest.start_time;
      return {
        timestamp,
        forecasterCount: forecast?.forecaster_count ?? 0,
        interval_lower_bound: forecast?.interval_lower_bounds![0],
        center: forecast?.centers![0],
        interval_upper_bound: forecast?.interval_upper_bounds![0],
      };
    }
    return {
      timestamp: forecast?.start_time ?? cursorTimestamp,
      forecasterCount: forecast?.forecaster_count ?? 0,
      interval_lower_bound: forecast?.interval_lower_bounds![0],
      center: forecast?.centers![0],
      interval_upper_bound: forecast?.interval_upper_bounds![0],
    };
  }, [
    cursorTimestamp,
    aggregate.history,
    question.my_forecasts,
    isCPRevealed,
    nrForecasters,
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
      <div className="relative">
        <NumericChart
          aggregation={question.aggregations.recency_weighted}
          myForecasts={question.my_forecasts}
          resolution={question.resolution}
          resolveTime={question.actual_resolve_time}
          onCursorChange={isCPRevealed ? handleCursorChange : undefined}
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
          hideCP={hideCP || !isCPRevealed}
          isCPRevealed={isCPRevealed}
          openTime={
            question.open_time
              ? new Date(question.open_time).getTime()
              : undefined
          }
        />
        {!isCPRevealed && (
          <CPRevealTime cpRevealTime={question.cp_reveal_time} />
        )}
      </div>
      <div
        className={classNames(
          "my-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 xs:gap-x-8 sm:mx-8 sm:grid sm:grid-cols-2 sm:gap-x-4 sm:gap-y-0",
          { "sm:grid-cols-3": !!question.my_forecasts?.history.length }
        )}
      >
        <CursorDetailItem
          title={t("totalForecastersLabel")}
          text={
            isCPRevealed
              ? cursorData!.forecasterCount?.toString()
              : String(nrForecasters)
          }
        />
        {!hideCP && isCPRevealed && (
          <CursorDetailItem
            title={t("communityPredictionLabel")}
            text={getDisplayValue(
              cursorData?.center,
              question.type,
              question.scaling,
              undefined,
              undefined,
              cursorData?.interval_lower_bound
                ? [
                    cursorData!.interval_lower_bound as number,
                    cursorData!.interval_upper_bound as number,
                  ]
                : []
            )}
            variant="prediction"
          />
        )}
        {!!question.my_forecasts?.history.length && (
          <CursorDetailItem
            title={t("myPrediction")}
            text={getDisplayUserValue(
              // TODO: switch to getDisplayValue, adding more details to cursorData
              question.my_forecasts,
              cursorData!.center as number,
              cursorData!.timestamp as number,
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

export default NumericChartCard;
