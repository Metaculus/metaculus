"use client";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

import ChoicesLegend from "@/app/(main)/questions/[id]/components/choices_legend";
import MultiForecastTimeline from "@/components/charts/multi_forecast_timeline";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { useAuth } from "@/contexts/auth_context";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceTooltipItem } from "@/types/choices";
import { QuestionWithMultipleChoiceForecasts } from "@/types/question";
import { generateForecastTimelinesFromMultipleChoiceQuestion } from "@/utils/charts";
import { ForecastTimelineData } from "@/types/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";

import ChoicesTooltip from "../choices_tooltip";

const MAX_VISIBLE_CHECKBOXES = 6;

const generateList = (question: QuestionWithMultipleChoiceForecasts) =>
  generateForecastTimelinesFromMultipleChoiceQuestion(question, {
    activeCount: MAX_VISIBLE_CHECKBOXES,
  });

type Props = {
  question: QuestionWithMultipleChoiceForecasts;
};

const MultipleChoiceChartCard: FC<Props> = ({ question }) => {
  const t = useTranslations();
  const { user } = useAuth();

  const { forecasts } = question;

  const [isChartReady, setIsChartReady] = useState(false);
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const [choiceItems, setChoiceItems] = useState<ForecastTimelineData[]>(
    generateList(question)
  );

  const timestampsCount = forecasts.timestamps.length;
  const prevTimestampsCount = usePrevious(timestampsCount);
  // sync BE driven data with local state
  useEffect(() => {
    if (prevTimestampsCount && prevTimestampsCount !== timestampsCount) {
      setChoiceItems(generateList(question));
    }
  }, [prevTimestampsCount, question, timestampsCount]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] = useTimestampCursor(
    forecasts.timestamps
  );

  const cursorIndex = useMemo(
    () =>
      forecasts.timestamps.findIndex(
        (timestamp) => timestamp === cursorTimestamp
      ),
    [cursorTimestamp, forecasts.timestamps]
  );

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(({ label, centers, color }) => ({
          choiceLabel: label,
          color,
          valueLabel: getForecastPctDisplayValue(centers[cursorIndex]),
        })),
    [choiceItems, cursorIndex]
  );

  const {
    isActive: isTooltipActive,
    getReferenceProps,
    getFloatingProps,
    refs,
    floatingStyles,
  } = useChartTooltip();

  const handleChoiceChange = useCallback((label: string, checked: boolean) => {
    setChoiceItems((prev) =>
      prev.map((item) =>
        item.label === label
          ? { ...item, active: checked, highlighted: false }
          : item
      )
    );
  }, []);
  const handleChoiceHighlight = useCallback(
    (label: string, highlighted: boolean) => {
      setChoiceItems((prev) =>
        prev.map((item) =>
          item.label === label ? { ...item, highlighted } : item
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
      <div className="flex items-center">
        <h3 className="m-0 text-base font-normal leading-5">
          {t("forecastTimelineHeading")}
        </h3>
        <div className="ml-auto dark:text-white">
          {t("totalForecastersLabel")}{" "}
          <strong>{forecasts.nr_forecasters[cursorIndex]}</strong>
        </div>
      </div>
      <div ref={refs.setReference} {...getReferenceProps()}>
        <MultiForecastTimeline
          forecastTimelines={choiceItems}
          questionType={question.type}
          scaling={{
            range_max: question.range_max,
            range_min: question.range_min,
            zero_point: question.zero_point,
          }}
          defaultZoom={
            user
              ? TimelineChartZoomOption.All
              : TimelineChartZoomOption.TwoMonths
          }
          withZoomPicker
          yLabel={t("communityPredictionLabel")}
          onCursorChange={handleCursorChange}
          onChartReady={handleChartReady}
        />
        {/* <MultipleChoiceChart
          timestamps={forecasts.timestamps}
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
        /> */}
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
          <ChoicesTooltip date={tooltipDate} choices={tooltipChoices} />
        </div>
      )}
    </div>
  );
};

export default MultipleChoiceChartCard;
