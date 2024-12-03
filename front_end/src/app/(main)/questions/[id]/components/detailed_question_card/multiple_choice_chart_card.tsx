"use client";
import { uniq } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useMemo, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multiple_choices_chart_view";
import { useAuth } from "@/contexts/auth_context";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { QuestionWithMultipleChoiceForecasts } from "@/types/question";
import {
  findPreviousTimestamp,
  generateChoiceItemsFromMultipleChoiceForecast,
} from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

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
  isCPRevealed?: boolean;
};

const MultipleChoiceChartCard: FC<Props> = ({
  question,
  embedMode = false,
  chartHeight,
  defaultZoom,
  chartTheme,
  hideCP,
  isCPRevealed,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const actualCloseTime = question.actual_close_time
    ? new Date(question.actual_close_time).getTime()
    : null;
  const isClosed = question.actual_close_time
    ? new Date(question.actual_close_time).getTime() < Date.now()
    : false;

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(question)
  );

  const aggregationTimestampCount =
    question.aggregations.recency_weighted.history.length;
  const prevTimestampsCount = usePrevious(aggregationTimestampCount);

  const userTimestamps = useMemo(() => {
    return (
      question.my_forecasts?.history.map(({ start_time }) => start_time) ?? []
    );
  }, [question.my_forecasts?.history]);
  const aggregationTimestamps = useMemo(() => {
    return question.aggregations.recency_weighted.history.map(
      ({ start_time }) => start_time
    );
  }, [question.aggregations.recency_weighted.history]);
  const latestTimestamp = Math.max(
    aggregationTimestamps.at(-1) || 0,
    userTimestamps.at(-1) || 0,
    ...(actualCloseTime ? [actualCloseTime] : [])
  );
  const allTimestamps = uniq([
    ...aggregationTimestamps,
    ...userTimestamps,
    latestTimestamp,
  ]).sort((a, b) => a - b);

  const userTimestampsCount = question.my_forecasts?.history.length;
  const prevUserTimestampsCount = usePrevious(userTimestampsCount);
  // sync BE driven data with local state
  useEffect(() => {
    if (
      (prevTimestampsCount &&
        prevTimestampsCount !== aggregationTimestampCount) ||
      (userTimestampsCount && userTimestampsCount !== prevUserTimestampsCount)
    ) {
      setChoiceItems(generateList(question));
    }
  }, [
    prevTimestampsCount,
    question,
    aggregationTimestampCount,
    userTimestampsCount,
    prevUserTimestampsCount,
  ]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(allTimestamps);

  const aggregationCursorIndex = useMemo(
    () =>
      aggregationTimestamps.indexOf(
        findPreviousTimestamp(aggregationTimestamps, cursorTimestamp)
      ),
    [cursorTimestamp, aggregationTimestamps]
  );
  const userCursorIndex = useMemo(
    () =>
      userTimestamps.indexOf(
        findPreviousTimestamp(userTimestamps, cursorTimestamp)
      ),
    [cursorTimestamp, userTimestamps]
  );

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(({ choice, aggregationValues, color }) => ({
          choiceLabel: choice,
          color,
          valueLabel: hideCP
            ? "..."
            : getForecastPctDisplayValue(
                aggregationValues[aggregationCursorIndex]
              ),
        })),
    [choiceItems, aggregationCursorIndex, hideCP]
  );

  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(() => {
    return choiceItems
      .filter(({ active }) => active)
      .map(({ choice, userValues, color }) => ({
        choiceLabel: choice,
        color,
        valueLabel: getForecastPctDisplayValue(userValues[userCursorIndex]),
      }));
  }, [choiceItems, userCursorIndex]);

  const forecastersCount = useMemo(() => {
    // okay to search for the first item since all items have the same values
    const aggregationForecasterCounts =
      choiceItems[0]?.aggregationForecasterCounts;
    if (!aggregationForecasterCounts) {
      return null;
    }

    return aggregationForecasterCounts[aggregationCursorIndex] ?? null;
  }, [aggregationCursorIndex, choiceItems]);

  return (
    <MultiChoicesChartView
      tooltipChoices={tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      choiceItems={choiceItems}
      hideCP={hideCP}
      timestamps={allTimestamps}
      forecastersCount={forecastersCount}
      tooltipDate={tooltipDate}
      onCursorChange={isCPRevealed ? handleCursorChange : undefined}
      onChoiceItemsUpdate={setChoiceItems}
      isClosed={isClosed}
      actualCloseTime={actualCloseTime}
      title={t("forecastTimelineHeading")}
      yLabel={t("communityPredictionLabel")}
      chartTheme={chartTheme}
      embedMode={embedMode}
      chartHeight={chartHeight}
      defaultZoom={defaultZoom}
      isCPRevealed={isCPRevealed}
      cpRevealTime={question.cp_reveal_time}
    />
  );
};

export default MultipleChoiceChartCard;
