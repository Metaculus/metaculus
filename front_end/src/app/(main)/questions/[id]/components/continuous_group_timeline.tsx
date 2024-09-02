"use client";

import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { useAuth } from "@/contexts/auth_context";
import useChartTooltip from "@/hooks/use_chart_tooltip";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import { Question, QuestionWithNumericForecasts } from "@/types/question";
import {
  findPreviousTimestamp,
  generateChoiceItemsFromBinaryGroup,
  getDisplayValue,
} from "@/utils/charts";
import { generateUserForecasts } from "@/utils/questions";
import ChoicesLegend from "./choices_legend";
import ChoicesTooltip from "./choices_tooltip";

const MAX_VISIBLE_CHECKBOXES = 6;

function getQuestionTooltipLabel(
  timestamps: number[],
  values: number[],
  cursorTimestamp: number,
  question: Question
) {
  const hasValue =
    cursorTimestamp >= Math.min(...timestamps) &&
    cursorTimestamp <= Math.max(...timestamps);
  if (!hasValue) {
    return "?";
  }

  const closestTimestamp = findPreviousTimestamp(timestamps, cursorTimestamp);
  const cursorIndex = timestamps.findIndex(
    (timestamp) => timestamp === closestTimestamp
  );

  return getDisplayValue(values[cursorIndex], question);
}

function generateList(
  questions: QuestionWithNumericForecasts[],
  preselectedQuestionId?: number
) {
  return generateChoiceItemsFromBinaryGroup(questions, {
    withMinMax: true,
    activeCount: MAX_VISIBLE_CHECKBOXES,
    preselectedQuestionId,
  });
}

type Props = {
  questions: QuestionWithNumericForecasts[];
  timestamps: number[];
  isClosed?: boolean;
};

const ContinuousGroupTimeline: FC<Props> = ({
  questions,
  timestamps,
  isClosed,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [isChartReady, setIsChartReady] = useState(false);
  const handleChartReady = useCallback(() => {
    setIsChartReady(true);
  }, []);

  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(questions)
  );
  const userForecasts = user ? generateUserForecasts(questions) : undefined;
  const timestampsCount = timestamps.length;
  const prevTimestampsCount = usePrevious(timestampsCount);
  // sync BE driven data with local state
  useEffect(() => {
    if (prevTimestampsCount && prevTimestampsCount !== timestampsCount) {
      setChoiceItems(generateList(questions));
    }
  }, [questions, prevTimestampsCount, timestampsCount]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(
          ({ choice, values, color, timestamps: optionTimestamps }, index) => {
            return {
              choiceLabel: choice,
              color,
              valueLabel: getQuestionTooltipLabel(
                optionTimestamps ?? timestamps,
                values,
                cursorTimestamp,
                questions[index]
              ),
            };
          }
        ),
    [choiceItems, cursorTimestamp, timestamps]
  );

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
      <div className="flex items-center">
        <h3 className="m-0 text-base font-normal leading-5">
          {t("forecastTimelineHeading")}
        </h3>
      </div>
      <div ref={refs.setReference} {...getReferenceProps()}>
        <MultipleChoiceChart
          timestamps={timestamps}
          choiceItems={choiceItems}
          yLabel={t("communityPredictionLabel")}
          onChartReady={handleChartReady}
          onCursorChange={handleCursorChange}
          userForecasts={userForecasts}
          questionType={questions[0].type}
          scaling={questions[0].scaling}
          isClosed={isClosed}
        />
      </div>

      <div className="mt-3">
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

export default ContinuousGroupTimeline;
