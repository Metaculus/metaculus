"use client";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multi_choices_chart_view";
import { useAuth } from "@/contexts/auth_context";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { QuestionWithMultipleChoiceForecasts } from "@/types/question";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";
import { generateUserForecastsForMultipleQuestion } from "@/utils/questions";

const MAX_VISIBLE_CHECKBOXES = 6;

const generateList = (question: QuestionWithMultipleChoiceForecasts) =>
  generateChoiceItemsFromMultipleChoiceForecast(question, {
    activeCount: MAX_VISIBLE_CHECKBOXES,
  });

type Props = {
  question: QuestionWithMultipleChoiceForecasts;
  embedMode?: boolean;
  chartHeight?: number;
  defaultZoom?: TimelineChartZoomOption;
  chartTheme?: VictoryThemeDefinition;
  hideCP?: boolean;
};

const MultipleChoiceChartCard: FC<Props> = ({
  question,
  embedMode = false,
  chartHeight,
  defaultZoom,
  chartTheme,
  hideCP,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const history = question.aggregations.recency_weighted.history;
  const timestamps = history.map((forecast) => forecast.start_time);

  const actualCloseTime = question.actual_close_time
    ? new Date(question.actual_close_time).getTime()
    : null;
  const isClosed = question.actual_close_time
    ? new Date(question.actual_close_time).getTime() < Date.now()
    : false;

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
    <MultiChoicesChartView
      tooltipChoices={hideCP ? [] : tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      choiceItems={hideCP ? [] : choiceItems}
      timestamps={timestamps}
      userForecasts={userForecasts}
      tooltipDate={tooltipDate}
      onCursorChange={handleCursorChange}
      onChoiceItemChange={handleChoiceChange}
      onChoiceItemHighlight={handleChoiceHighlight}
      onToggleSelectAll={toggleSelectAll}
      isClosed={isClosed}
      actualCloseTime={actualCloseTime}
      title={t("forecastTimelineHeading")}
      yLabel={t("communityPredictionLabel")}
      chartTheme={chartTheme}
      embedMode={embedMode}
      chartHeight={chartHeight}
      defaultZoom={defaultZoom}
    />
  );
};

export default MultipleChoiceChartCard;
