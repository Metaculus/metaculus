"use client";
import { uniq } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multiple_choices_chart_view";
import CPRevealTime from "@/components/cp_reveal_time";
import { MultipleChoiceTile } from "@/components/post_card/multiple_choice_tile";
import { METAC_COLORS } from "@/constants/colors";
import useContainerSize from "@/hooks/use_container_size";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import {
  ForecastAvailability,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { generateChoiceItemsFromMultipleChoiceForecast } from "@/utils/questions/choices";
import { getPostDrivenTime } from "@/utils/questions/helpers";

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
  const { ref: containerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();

  const actualCloseTime = getPostDrivenTime(question.actual_close_time);
  const openTime = getPostDrivenTime(question.open_time);
  const isClosed = actualCloseTime ? actualCloseTime < Date.now() : false;

  const maxVisibleCheckboxes = useMemo(() => {
    if (!embedMode) return 3;
    if (!containerWidth) return 4;
    if (containerWidth < 510) return 3;
    return 4;
  }, [embedMode, containerWidth]);

  const generateList = useCallback(
    (q: QuestionWithMultipleChoiceForecasts) =>
      generateChoiceItemsFromMultipleChoiceForecast(q, {
        activeCount: maxVisibleCheckboxes,
      }),
    [maxVisibleCheckboxes]
  );

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(question)
  );

  useEffect(() => {
    setChoiceItems(generateList(question));
  }, [question, generateList]);

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

  const [cursorTimestamp, _tooltipDate, handleCursorChange] =
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

  const embedChoiceItems = useMemo(() => {
    if (!embedMode) return choiceItems;
    const othersLabel = "Others";

    return buildEmbedChoicesWithOthers(
      choiceItems,
      maxVisibleCheckboxes,
      othersLabel
    );
  }, [choiceItems, embedMode, maxVisibleCheckboxes]);

  if (embedMode) {
    return (
      <div ref={containerRef}>
        <MultipleChoiceTile
          timestamps={timestamps}
          choices={embedChoiceItems}
          visibleChoicesCount={embedChoiceItems.length}
          question={question}
          hideCP={hideCP}
          actualCloseTime={actualCloseTime}
          openTime={openTime}
          forecastAvailability={forecastAvailability}
          canPredict={false}
          showChart
          chartHeight={chartHeight}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      <MultiChoicesChartView
        questionType={question.type}
        tooltipTitle={question.group_variable}
        tooltipChoices={tooltipChoices}
        tooltipUserChoices={tooltipUserChoices}
        choiceItems={choiceItems}
        hideCP={hideCP}
        timestamps={timestamps}
        forecastersCount={forecastersCount}
        onCursorChange={handleCursorChange}
        onChoiceItemsUpdate={setChoiceItems}
        isClosed={isClosed}
        actualCloseTime={actualCloseTime}
        title={t("forecastTimelineHeading")}
        chartTheme={chartTheme}
        embedMode={embedMode}
        chartHeight={chartHeight}
        defaultZoom={defaultZoom}
        forecastAvailability={forecastAvailability}
        openTime={openTime}
      />
    </div>
  );
};

const OTHERS_COLOR: ThemeColor = METAC_COLORS.gray[400];

function buildEmbedChoicesWithOthers(
  choices: ChoiceItem[],
  baseCount: number,
  othersLabel: string
): ChoiceItem[] {
  if (choices.length <= baseCount) return choices;

  const head = choices.slice(0, baseCount);
  const tail = choices.slice(baseCount);
  const aggLen = Math.max(
    ...tail.map((c) => c.aggregationValues?.length ?? 0),
    0
  );
  const aggregationValues = Array.from({ length: aggLen }, (_, i) =>
    tail.reduce((sum, c) => sum + (c.aggregationValues?.[i] ?? 0), 0)
  );

  const userLen = Math.max(...tail.map((c) => c.userValues?.length ?? 0), 0);
  const userValues: (number | null)[] =
    userLen > 0
      ? Array.from({ length: userLen }, (_, i) =>
          tail.reduce((sum, c) => sum + (c.userValues?.[i] ?? 0), 0)
        )
      : [];

  const template = tail[0];
  const others: ChoiceItem = {
    ...template,
    choice: othersLabel,
    color: OTHERS_COLOR,
    aggregationValues,
    userValues,
    resolution: null,
    displayedResolution: null,
    active: true,
    highlighted: template?.highlighted ?? false,
    aggregationTimestamps: template?.aggregationTimestamps ?? [],
    aggregationMinValues:
      template?.aggregationMinValues.map((v) => v ?? 0) ?? [],
    aggregationMaxValues:
      template?.aggregationMaxValues.map((v) => v ?? 0) ?? [],
    userTimestamps: template?.userTimestamps ?? [],
    aggregationForecasterCounts:
      template?.aggregationForecasterCounts.map((v) => v ?? 0) ?? [],
  };

  return [...head, others];
}

export default DetailedMultipleChoiceChartCard;
