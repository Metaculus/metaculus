import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multiple_choices_chart_view";
import { useAuth } from "@/contexts/auth_context";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import {
  QuestionLinearGraphType,
  Question,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  findPreviousTimestamp,
  generateChoiceItemsFromGroupQuestions,
  getContinuousGroupScaling,
  getDisplayValue,
} from "@/utils/charts";
import { generateUserForecasts } from "@/utils/questions";

type Props = {
  questions: QuestionWithNumericForecasts[];
  timestamps: number[];
  type: QuestionLinearGraphType;
  actualCloseTime?: number | null;
  isClosed?: boolean;

  preselectedQuestionId?: number;
  hideCP?: boolean;
  maxVisibleCheckboxes?: number;

  defaultZoom?: TimelineChartZoomOption;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  embedMode?: boolean;
  withLegend?: boolean;
  isCPRevealed?: boolean;
  cpRevealTime?: string;
};

const MultipleChoiceGroupChart: FC<Props> = ({
  questions,
  timestamps,
  type,
  actualCloseTime,
  isClosed,

  preselectedQuestionId,
  hideCP,
  maxVisibleCheckboxes = 6,

  defaultZoom,
  chartHeight,
  chartTheme,
  embedMode,
  withLegend,
  isCPRevealed = true,
  cpRevealTime,
}) => {
  const t = useTranslations();
  const { user } = useAuth();

  const scaling =
    type === "continuous" ? getContinuousGroupScaling(questions) : undefined;

  const userForecasts = useMemo(
    () => (user ? generateUserForecasts(questions, scaling) : undefined),
    [user, questions, scaling]
  );

  const timestampsCount = timestamps.length;
  const prevTimestampsCount = usePrevious(timestampsCount);
  const latestUserTimestamp = useMemo(() => {
    if (!userForecasts) {
      return null;
    }

    return Math.max(
      ...userForecasts
        .map((forecast) => forecast.timestamps?.at(-1) ?? 0)
        .filter((timestamp) => timestamp !== undefined)
    );
  }, [userForecasts]);
  const prevUserTimestamp = usePrevious(latestUserTimestamp);

  const generateList = useCallback(
    (
      questions: QuestionWithNumericForecasts[],
      preselectedQuestionId?: number
    ): ChoiceItem[] => {
      return generateChoiceItemsFromGroupQuestions(questions, {
        withMinMax: true,
        activeCount: maxVisibleCheckboxes,
        preselectedQuestionId,
        preserveOrder: type === "binary",
      });
    },
    [maxVisibleCheckboxes, type]
  );
  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(questions, preselectedQuestionId)
  );
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
    generateList,
  ]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(
          ({
            id,
            choice,
            values,
            color,
            timestamps: optionTimestamps,
            closeTime,
          }) => {
            return {
              choiceLabel: choice,
              color,
              valueLabel: hideCP
                ? "-"
                : getQuestionTooltipLabel({
                    timestamps: optionTimestamps ?? timestamps,
                    values,
                    cursorTimestamp,
                    closeTime,
                    question: questions.find((q) => q.id === id) as Question,
                  }),
            };
          }
        ),
    [choiceItems, cursorTimestamp, hideCP, questions, timestamps]
  );
  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(() => {
    if (!userForecasts) {
      return [];
    }

    return userForecasts.map(
      (
        { choice, values, color, timestamps: optionTimestamps, unscaledValues },
        index
      ) => {
        return {
          choiceLabel: choice,
          color,
          valueLabel: getQuestionTooltipLabel({
            timestamps: optionTimestamps ?? timestamps,
            values:
              type === "binary" ? values ?? [] : unscaledValues ?? values ?? [],
            cursorTimestamp,
            question: questions[index],
            isUserPrediction: true,
          }),
        };
      }
    );
  }, [userForecasts, timestamps, type, cursorTimestamp, questions]);

  const forecastersCount = useMemo(() => {
    // display cursor based value when viewing a single active option
    const selectedChoices = choiceItems.filter(({ active }) => active);
    if (selectedChoices.length === 1) {
      const selectedChoice = selectedChoices.at(0);
      if (!selectedChoice) {
        return null;
      }

      const actualTimestamps = selectedChoice.timestamps ?? timestamps;
      const closestTimestamp = findPreviousTimestamp(
        actualTimestamps,
        cursorTimestamp
      );
      const cursorIndex = actualTimestamps.findIndex(
        (timestamp) => timestamp === closestTimestamp
      );

      return selectedChoice.forecastersCount?.[cursorIndex] ?? null;
    }

    // otherwise display the value when option is highlighted
    const highlightedChoice = choiceItems.find(
      ({ highlighted }) => highlighted
    );
    if (!highlightedChoice) {
      return null;
    }
    return highlightedChoice.forecastersCount?.at(-1) ?? null;
  }, [choiceItems, cursorTimestamp, timestamps]);

  return (
    <MultiChoicesChartView
      tooltipChoices={tooltipChoices}
      tooltipUserChoices={tooltipUserChoices}
      forecastersCount={forecastersCount}
      choiceItems={!!hideCP ? [] : choiceItems}
      timestamps={timestamps}
      userForecasts={userForecasts}
      tooltipDate={tooltipDate}
      onCursorChange={isCPRevealed ? handleCursorChange : undefined}
      onChoiceItemsUpdate={setChoiceItems}
      isClosed={isClosed}
      actualCloseTime={actualCloseTime}
      questionType={questions[0].type}
      scaling={scaling}
      title={t("forecastTimelineHeading")}
      yLabel={t("communityPredictionLabel")}
      chartTheme={chartTheme}
      embedMode={embedMode}
      chartHeight={chartHeight}
      withLegend={withLegend}
      defaultZoom={defaultZoom}
      isCPRevealed={isCPRevealed}
      cpRevealTime={cpRevealTime}
    />
  );
};

function getQuestionTooltipLabel({
  timestamps,
  values,
  cursorTimestamp,
  question,
  isUserPrediction,
  closeTime,
}: {
  timestamps: number[];
  values: number[];
  cursorTimestamp: number;
  question: Question;
  isUserPrediction?: boolean;
  closeTime?: number | undefined;
}) {
  const hasValue = isUserPrediction
    ? cursorTimestamp >= Math.min(...timestamps)
    : cursorTimestamp >= Math.min(...timestamps) &&
      cursorTimestamp <= Math.max(...timestamps, closeTime ?? 0);
  if (!hasValue) {
    return "?";
  }

  const closestTimestamp = findPreviousTimestamp(timestamps, cursorTimestamp);
  const cursorIndex = timestamps.findIndex(
    (timestamp) => timestamp === closestTimestamp
  );

  const value = !isNil(cursorIndex) ? values[cursorIndex] : null;
  return getDisplayValue(value, question.type, question.scaling);
}

export default MultipleChoiceGroupChart;
