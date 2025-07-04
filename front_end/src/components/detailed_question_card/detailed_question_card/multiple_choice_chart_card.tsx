"use client";
import { uniq } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multiple_choices_chart_view";
import CPRevealTime from "@/components/cp_reveal_time";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import {
  ForecastAvailability,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/questions/choices";
import { getPostDrivenTime } from "@/utils/questions/helpers";

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
  forecastAvailability?: ForecastAvailability;
};

const DetailedMultipleChoiceChartCard: FC<Props> = ({
  question,
  embedMode = false,
  chartHeight,
  defaultZoom,
  chartTheme,
  hideCP,
  forecastAvailability,
}) => {
  const t = useTranslations();

  const actualCloseTime = getPostDrivenTime(question.actual_close_time);
  const openTime = getPostDrivenTime(question.open_time);
  const isClosed = actualCloseTime ? actualCloseTime < Date.now() : false;

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(question)
  );

  useEffect(() => {
    setChoiceItems(generateList(question));
  }, [question]);

  const timestamps = useMemo(() => {
    if (!forecastAvailability?.cpRevealsOn) {
      return uniq([
        ...(choiceItems[0]?.aggregationTimestamps ?? []),
        ...(choiceItems[0]?.userTimestamps ?? []),
      ]);
    }

    return choiceItems[0]?.userTimestamps ?? [];
  }, [choiceItems, forecastAvailability]);
  const userTimestamps = useMemo(
    () => choiceItems[0]?.userTimestamps ?? [],
    [choiceItems]
  );

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  const aggregationCursorIndex = useMemo(() => {
    return timestamps.indexOf(
      findPreviousTimestamp(timestamps, cursorTimestamp)
    );
  }, [timestamps, cursorTimestamp]);
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

  const getOptionTooltipValue = useCallback(
    (aggregatedValue: number | null | undefined) => {
      if (!!forecastAvailability?.cpRevealsOn) {
        return <CPRevealTime cpRevealTime={forecastAvailability.cpRevealsOn} />;
      }

      if (forecastAvailability?.isEmpty) {
        return t("noForecastsYet");
      }

      if (hideCP) {
        return "...";
      }

      return getPredictionDisplayValue(aggregatedValue, {
        questionType: question.type,
        scaling: question.scaling,
        actual_resolve_time: question.actual_resolve_time ?? null,
      });
    },
    [
      forecastAvailability?.cpRevealsOn,
      forecastAvailability?.isEmpty,
      hideCP,
      question.actual_resolve_time,
      question.scaling,
      question.type,
      t,
    ]
  );

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(({ choice, aggregationValues, color }) => {
          const adjustedCursorIndex =
            aggregationCursorIndex >= aggregationValues.length
              ? aggregationValues.length - 1
              : aggregationCursorIndex;
          const aggregatedValue = aggregationValues.at(adjustedCursorIndex);

          return {
            choiceLabel: choice,
            color,
            valueElement: getOptionTooltipValue(aggregatedValue),
          };
        }),
    [choiceItems, aggregationCursorIndex, getOptionTooltipValue]
  );
  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(() => {
    return choiceItems
      .filter(({ active }) => active)
      .map(({ choice, userValues, color }) => ({
        choiceLabel: choice,
        color,
        valueElement: getPredictionDisplayValue(userValues[userCursorIndex], {
          questionType: question.type,
          scaling: question.scaling,
          actual_resolve_time: question.actual_resolve_time ?? null,
        }),
      }));
  }, [
    choiceItems,
    question.actual_resolve_time,
    question.scaling,
    question.type,
    userCursorIndex,
  ]);

  return (
    <MultiChoicesChartView
      tooltipChoices={tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      choiceItems={choiceItems}
      hideCP={hideCP}
      timestamps={timestamps}
      forecastersCount={forecastersCount}
      tooltipDate={tooltipDate}
      onCursorChange={handleCursorChange}
      onChoiceItemsUpdate={setChoiceItems}
      isClosed={isClosed}
      actualCloseTime={actualCloseTime}
      title={t("forecastTimelineHeading")}
      yLabel={t("communityPredictionLabel")}
      chartTheme={chartTheme}
      embedMode={embedMode}
      chartHeight={chartHeight}
      defaultZoom={defaultZoom}
      isEmptyDomain={
        !!forecastAvailability?.isEmpty || !!forecastAvailability?.cpRevealsOn
      }
      openTime={openTime}
    />
  );
};

export default DetailedMultipleChoiceChartCard;
