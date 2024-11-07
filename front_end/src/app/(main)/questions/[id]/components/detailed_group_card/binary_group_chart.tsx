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
import { QuestionWithNumericForecasts } from "@/types/question";
import {
  findPreviousTimestamp,
  generateChoiceItemsFromBinaryGroup,
} from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";
import { generateUserForecasts } from "@/utils/questions";

const MAX_VISIBLE_CHECKBOXES = 6;

function getQuestionTooltipLabel({
  timestamps,
  values,
  cursorTimestamp,
  isUserPrediction,
  closeTime,
}: {
  timestamps: number[];
  values: number[];
  cursorTimestamp: number;
  isUserPrediction?: boolean;
  closeTime?: number | undefined;
}) {
  const hasValue = isUserPrediction
    ? cursorTimestamp >= Math.min(...timestamps)
    : cursorTimestamp >= Math.min(...timestamps) &&
      cursorTimestamp <= Math.max(...timestamps, closeTime ?? 0);
  if (!hasValue) {
    return getForecastPctDisplayValue(null);
  }
  if (isUserPrediction) {
    let closestTimestampIndex = 0;
    timestamps.forEach((timestamp, index) => {
      if (cursorTimestamp >= timestamp) {
        closestTimestampIndex = index;
      }
    });
    return getForecastPctDisplayValue(values[closestTimestampIndex]);
  }
  const closestTimestamp = findPreviousTimestamp(timestamps, cursorTimestamp);
  const cursorIndex = timestamps.findIndex(
    (timestamp) => timestamp === closestTimestamp
  );

  return getForecastPctDisplayValue(values[cursorIndex]);
}

function generateList(
  questions: QuestionWithNumericForecasts[],
  preselectedQuestionId?: number
) {
  return generateChoiceItemsFromBinaryGroup(questions, {
    withMinMax: true,
    activeCount: MAX_VISIBLE_CHECKBOXES,
    preselectedQuestionId,
    preserveOrder: true,
  });
}

type Props = {
  questions: QuestionWithNumericForecasts[];
  timestamps: number[];
  preselectedQuestionId?: number;
  defaultZoom?: TimelineChartZoomOption;
  isClosed?: boolean;
  actualCloseTime?: number | null;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  embedMode?: boolean;
  hideCP?: boolean;
};

const BinaryGroupChart: FC<Props> = ({
  questions,
  timestamps,
  preselectedQuestionId,
  defaultZoom,
  isClosed,
  actualCloseTime,
  chartTheme,
  chartHeight,
  embedMode = false,
  hideCP,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(questions, preselectedQuestionId)
  );
  const userForecasts = useMemo(
    () => (user ? generateUserForecasts(questions) : undefined),
    [user, questions]
  );

  const timestampsCount = timestamps.length;
  const prevTimestampsCount = usePrevious(timestampsCount);
  const latestUserTimestamp = userForecasts
    ? Math.max(
        ...userForecasts
          .map((forecast) => forecast.timestamps?.at(-1) ?? 0)
          .filter((timestamp) => timestamp !== undefined)
      )
    : undefined;
  const prevUserTimestamp = usePrevious(latestUserTimestamp);
  // sync BE driven data with local state
  useEffect(() => {
    if (
      (prevTimestampsCount && prevTimestampsCount !== timestampsCount) ||
      (latestUserTimestamp && latestUserTimestamp !== prevUserTimestamp)
    ) {
      setChoiceItems(generateList(questions, preselectedQuestionId));
    }
  }, [
    questions,
    prevTimestampsCount,
    timestampsCount,
    preselectedQuestionId,
    latestUserTimestamp,
    prevUserTimestamp,
  ]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(
          ({
            choice,
            values,
            color,
            timestamps: optionTimestamps,
            resolution,
            closeTime,
          }) => {
            return {
              choiceLabel: choice,
              color,
              valueLabel: getQuestionTooltipLabel({
                timestamps: optionTimestamps ?? timestamps,
                values,
                cursorTimestamp,
                closeTime,
              }),
            };
          }
        ),
    [choiceItems, cursorTimestamp, timestamps]
  );

  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      userForecasts == null
        ? []
        : userForecasts?.map(
            ({ choice, values, color, timestamps: optionTimestamps }) => {
              return {
                choiceLabel: choice,
                color,
                valueLabel: getQuestionTooltipLabel({
                  timestamps: optionTimestamps ?? timestamps,
                  values: values ?? [],
                  cursorTimestamp,
                  isUserPrediction: true,
                }),
              };
            }
          ),
    [userForecasts, cursorTimestamp, timestamps]
  );

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
      tooltipChoices={!!hideCP ? [] : tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      choiceItems={!!hideCP ? [] : choiceItems}
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

export default BinaryGroupChart;
