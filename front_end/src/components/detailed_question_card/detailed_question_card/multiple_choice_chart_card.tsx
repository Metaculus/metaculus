"use client";
import { uniq } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multiple_choices_chart_view";
import CPRevealTime from "@/components/cp_reveal_time";
import { MultipleChoiceTile } from "@/components/post_card/multiple_choice_tile";
import { getEffectiveVisibleCount } from "@/constants/questions";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import {
  ForecastAvailability,
  QuestionWithMultipleChoiceForecasts,
} from "@/types/question";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import {
  buildChoicesWithOthers,
  generateChoiceItemsFromMultipleChoiceForecast,
} from "@/utils/questions/choices";
import { getPostDrivenTime } from "@/utils/questions/helpers";

type Props = {
  question: QuestionWithMultipleChoiceForecasts;
  embedMode?: boolean;
  chartHeight?: number;
  defaultZoom?: TimelineChartZoomOption;
  chartTheme?: VictoryThemeDefinition;
  hideCP?: boolean;
  forecastAvailability?: ForecastAvailability;
  onLegendHeightChange?: (height: number) => void;
};

const DetailedMultipleChoiceChartCard: FC<Props> = ({
  question,
  embedMode = false,
  chartHeight,
  defaultZoom,
  chartTheme,
  hideCP,
  forecastAvailability,
  onLegendHeightChange,
}) => {
  const t = useTranslations();
  const [isChartHovered, setIsChartHovered] = useState(false);

  const actualCloseTime = getPostDrivenTime(question.actual_close_time);
  const openTime = getPostDrivenTime(question.open_time);
  const isClosed = actualCloseTime ? actualCloseTime < Date.now() : false;

  const maxVisibleCheckboxes = useMemo(
    () => getEffectiveVisibleCount(question.options?.length ?? 0),
    [question.options?.length]
  );

  const generateList = useCallback(
    (q: QuestionWithMultipleChoiceForecasts) =>
      generateChoiceItemsFromMultipleChoiceForecast(q, t, {
        activeCount: maxVisibleCheckboxes,
        hideCP,
        cpRevealsOn: forecastAvailability?.cpRevealsOn,
      }),
    [t, maxVisibleCheckboxes, hideCP, forecastAvailability?.cpRevealsOn]
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

  const liveOptions = useMemo(() => {
    if (!question.options_history?.length || cursorTimestamp === null) {
      return question.options ?? [];
    }

    const sortedHistory = [...question.options_history].sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
    let optionsAtTime = sortedHistory[0]?.[1] ?? question.options ?? [];
    sortedHistory.forEach(([timestamp, options]) => {
      if (new Date(timestamp).getTime() / 1000 <= cursorTimestamp) {
        optionsAtTime = options;
      }
    });
    return optionsAtTime;
  }, [cursorTimestamp, question.options, question.options_history]);

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

  const othersItem = useMemo(() => {
    const inactive = choiceItems.filter((c) => !c.active);
    if (inactive.length === 0) return null;
    const withOthers = buildChoicesWithOthers(
      choiceItems,
      t("othersCount", { count: inactive.length })
    );
    return withOthers[withOthers.length - 1] ?? null;
  }, [choiceItems, t]);

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

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(() => {
    const items = choiceItems
      .filter(({ active, choice }) => active && liveOptions.includes(choice))
      .map(({ label, choice, aggregationValues, color }) => {
        const adjustedCursorIndex =
          aggregationCursorIndex >= aggregationValues.length
            ? aggregationValues.length - 1
            : aggregationCursorIndex;
        const aggregatedValue = aggregationValues.at(adjustedCursorIndex);
        return {
          choiceLabel: label || choice,
          color,
          valueElement: getOptionTooltipValue(aggregatedValue),
        };
      });

    if (othersItem) {
      const adjustedCursorIndex =
        aggregationCursorIndex >= othersItem.aggregationValues.length
          ? othersItem.aggregationValues.length - 1
          : aggregationCursorIndex;
      const aggregatedValue =
        othersItem.aggregationValues.at(adjustedCursorIndex);
      items.push({
        choiceLabel: othersItem.choice,
        color: othersItem.color,
        valueElement: getOptionTooltipValue(aggregatedValue),
      });
    }

    return items;
  }, [
    choiceItems,
    aggregationCursorIndex,
    getOptionTooltipValue,
    liveOptions,
    othersItem,
  ]);

  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(() => {
    const items = choiceItems
      .filter(({ active, choice }) => active && liveOptions.includes(choice))
      .map(({ label, choice, userValues, color }) => ({
        choiceLabel: label || choice,
        color,
        valueElement: getPredictionDisplayValue(userValues[userCursorIndex], {
          questionType: question.type,
          scaling: question.scaling,
          actual_resolve_time: question.actual_resolve_time ?? null,
        }),
      }));

    if (othersItem) {
      items.push({
        choiceLabel: othersItem.choice,
        color: othersItem.color,
        valueElement: getPredictionDisplayValue(
          othersItem.userValues[userCursorIndex],
          {
            questionType: question.type,
            scaling: question.scaling,
            actual_resolve_time: question.actual_resolve_time ?? null,
          }
        ),
      });
    }

    return items;
  }, [
    choiceItems,
    question.actual_resolve_time,
    question.scaling,
    question.type,
    userCursorIndex,
    liveOptions,
    othersItem,
  ]);

  const embedChoiceItems = useMemo(() => {
    if (!embedMode) return choiceItems;

    const inactive = choiceItems.filter((c) => !c.active);
    return buildChoicesWithOthers(
      choiceItems,
      t("othersCount", { count: inactive.length })
    );
  }, [choiceItems, embedMode, t]);

  if (embedMode) {
    return (
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
        onLegendHeightChange={onLegendHeightChange}
        onCursorChange={handleCursorChange}
        withHoverTooltip={false}
        showCursorLabel={false}
        legendCursorTimestamp={isChartHovered ? cursorTimestamp : null}
        onCursorActiveChange={setIsChartHovered}
        defaultChartZoom={defaultZoom}
      />
    );
  }

  return (
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
  );
};

export default DetailedMultipleChoiceChartCard;
