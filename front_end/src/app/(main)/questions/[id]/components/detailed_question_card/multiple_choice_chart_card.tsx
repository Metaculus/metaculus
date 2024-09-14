"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

import ChoicesLegend from "@/app/(main)/questions/[id]/components/choices_legend";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { useAuth } from "@/contexts/auth_context";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { QuestionWithMultipleChoiceForecasts } from "@/types/question";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

import ChoicesTooltip from "../choices_tooltip";
import { generateUserForecastsForMultipleQuestion } from "@/utils/questions";

const MAX_VISIBLE_CHECKBOXES = 6;

const generateList = (question: QuestionWithMultipleChoiceForecasts) =>
  generateChoiceItemsFromMultipleChoiceForecast(question, {
    activeCount: MAX_VISIBLE_CHECKBOXES,
  });

type Props = {
  question: QuestionWithMultipleChoiceForecasts;
  embedMode?: boolean;
};

const MultipleChoiceChartCard: FC<Props> = ({
  question,
  embedMode = false,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const history = question.aggregations.recency_weighted.history;
  const timestamps = history.map((forecast) => forecast.start_time);

  const [isChartReady, setIsChartReady] = useState(false);
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(question)
  );
  const userForecasts = user
    ? generateUserForecastsForMultipleQuestion(question)
    : undefined;
  const timestampsCount = timestamps.length;
  const prevTimestampsCount = usePrevious(timestampsCount);

  const userTimestampsCount = question.my_forecasts?.history.length;
  const prevUserTimestampsCount = usePrevious(userTimestampsCount);
  // sync BE driven data with local state
  useEffect(() => {
    if (
      (prevTimestampsCount && prevTimestampsCount !== timestampsCount) ||
      (userTimestampsCount && userTimestampsCount !== prevUserTimestampsCount)
    ) {
      setChoiceItems(generateList(question));
    }
  }, [
    prevTimestampsCount,
    question,
    timestampsCount,
    userTimestampsCount,
    prevUserTimestampsCount,
  ]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  const cursorIndex = useMemo(
    () => timestamps.findIndex((timestamp) => timestamp === cursorTimestamp),
    [cursorTimestamp, timestamps]
  );

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(({ choice, values, color }) => ({
          choiceLabel: choice,
          color,
          valueLabel: getForecastPctDisplayValue(values[cursorIndex]),
        })),
    [choiceItems, cursorIndex]
  );

  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(() => {
    if (!userForecasts) {
      return [];
    }

    return userForecasts.map(
      ({ choice, values, color, timestamps: optionTimestamps }) => {
        const timestampIndex = optionTimestamps?.findLastIndex(
          (timestamp) => timestamp <= cursorTimestamp
        );

        return {
          choiceLabel: choice,
          color,
          valueLabel: getForecastPctDisplayValue(
            timestampIndex === -1 || timestampIndex === undefined
              ? null
              : values?.[timestampIndex]
          ),
        };
      }
    );
  }, [userForecasts, cursorTimestamp]);

  const {
    isActive: isTooltipActive,
    getReferenceProps,
    getFloatingProps,
    refs,
    floatingStyles,
  } = useChartTooltip();

  const handleChoiceChange = useCallback((choice: string, checked: boolean) => {
    setChoiceItems((prev) =>
      prev.map((item) =>
        item.choice === choice
          ? { ...item, active: checked, highlighted: false }
          : item
      )
    );
  }, []);
  const handleChoiceHighlight = useCallback(
    (choice: string, highlighted: boolean) => {
      setChoiceItems((prev) =>
        prev.map((item) =>
          item.choice === choice ? { ...item, highlighted } : item
        )
      );
    },
    []
  );
  const toggleSelectAll = useCallback((isAllSelected: boolean) => {
    if (isAllSelected) {
      setChoiceItems((prev) =>
        prev.map((item) => ({ ...item, active: false, highlighted: false }))
      );
    } else {
      setChoiceItems((prev) => prev.map((item) => ({ ...item, active: true })));
    }
  }, []);

  return (
    <div
      className={classNames(
        "flex w-full flex-col",
        isChartReady ? "opacity-100" : "opacity-0"
      )}
    >
      {!embedMode && (
        <div className="flex items-center">
          <h3 className="m-0 text-base font-normal leading-5">
            {t("forecastTimelineHeading")}
          </h3>
          <div className="ml-auto dark:text-white">
            {t("totalForecastersLabel")}{" "}
            <strong>{history[cursorIndex].forecaster_count}</strong>
          </div>
        </div>
      )}
      <div ref={refs.setReference} {...getReferenceProps()}>
        <MultipleChoiceChart
          actualCloseTime={
            question.actual_close_time
              ? new Date(question.actual_close_time).getTime()
              : null
          }
          timestamps={timestamps}
          choiceItems={choiceItems}
          yLabel={t("communityPredictionLabel")}
          onChartReady={handleChartReady}
          onCursorChange={handleCursorChange}
          defaultZoom={
            user
              ? TimelineChartZoomOption.All
              : TimelineChartZoomOption.TwoMonths
          }
          withZoomPicker
          isClosed={
            question.actual_close_time
              ? new Date(question.actual_close_time).getTime() < Date.now()
              : false
          }
          userForecasts={userForecasts}
        />
      </div>

      <div className="mb-4 mt-3">
        <ChoicesLegend
          choices={choiceItems}
          onChoiceChange={handleChoiceChange}
          onChoiceHighlight={handleChoiceHighlight}
          maxLegendChoices={MAX_VISIBLE_CHECKBOXES}
          onToggleAll={toggleSelectAll}
        />
      </div>

      {isTooltipActive && !!tooltipChoices.length && (
        <div
          className="pointer-events-none z-20 rounded bg-gray-0 p-2 leading-4 shadow-lg dark:bg-gray-0-dark"
          ref={refs.setFloating}
          style={floatingStyles}
          {...getFloatingProps()}
        >
          <ChoicesTooltip
            date={tooltipDate}
            choices={tooltipChoices}
            userChoices={tooltipUserChoices}
          />
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceChartCard;
