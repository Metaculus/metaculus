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
  getQuestionTimestamps,
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

  const actualCloseTime = question.actual_close_time
    ? new Date(question.actual_close_time).getTime()
    : null;
  const isClosed = question.actual_close_time
    ? new Date(question.actual_close_time).getTime() < Date.now()
    : false;

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(question)
  );

  const aggregationTimestamps = useMemo(
    () =>
      choiceItems[0]?.aggregationTimestamps
        ? choiceItems[0].aggregationTimestamps
        : [],
    [choiceItems]
  );
  const userTimestamps = useMemo(
    () => choiceItems[0]?.userTimestamps ?? [],
    [choiceItems]
  );

  const [cursorTimestamp, tooltipDate, handleCursorChange] = useTimestampCursor(
    aggregationTimestamps
  );

  const aggregationCursorIndex = useMemo(() => {
    return aggregationTimestamps.indexOf(
      findPreviousTimestamp(aggregationTimestamps, cursorTimestamp)
    );
  }, [aggregationTimestamps, cursorTimestamp]);
  const userCursorIndex = useMemo(() => {
    return userTimestamps.indexOf(
      findPreviousTimestamp(userTimestamps, cursorTimestamp)
    );
  }, [userTimestamps, cursorTimestamp]);

  const forecastersCount = useMemo(() => {
    const aggregationForecasterCounts =
      choiceItems[0]?.aggregationForecasterCounts;
    if (!aggregationForecasterCounts) {
      return null;
    }
    return aggregationForecasterCounts[aggregationCursorIndex] ?? null;
  }, [aggregationCursorIndex, choiceItems]);

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(() => {
    return choiceItems
      .filter(({ active }) => active)
      .map(({ choice, aggregationValues, color }) => ({
        choiceLabel: choice,
        color,
        valueLabel: hideCP
          ? "..."
          : getForecastPctDisplayValue(
              aggregationValues[aggregationCursorIndex]
            ),
      }));
  }, [choiceItems, aggregationCursorIndex, hideCP]);
  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(() => {
    return choiceItems
      .filter(({ active }) => active)
      .map(({ choice, userValues, color }) => ({
        choiceLabel: choice,
        color,
        valueLabel: getForecastPctDisplayValue(userValues[userCursorIndex]),
      }));
  }, [choiceItems, userCursorIndex]);

  return (
    <MultiChoicesChartView
      tooltipChoices={tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      choiceItems={choiceItems}
      hideCP={hideCP}
      timestamps={aggregationTimestamps}
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
