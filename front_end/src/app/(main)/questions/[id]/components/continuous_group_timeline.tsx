"use client";

import { useTranslations } from "next-intl";
import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { VictoryThemeDefinition } from "victory";

import MultiChoicesChartView from "@/app/(main)/questions/[id]/components/multi_choices_chart_view";
import { useAuth } from "@/contexts/auth_context";
import usePrevious from "@/hooks/use_previous";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem, ChoiceTooltipItem } from "@/types/choices";
import {
  Question,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import {
  findPreviousTimestamp,
  generateChoiceItemsFromBinaryGroup,
  getDisplayValue,
} from "@/utils/charts";
import { generateUserForecasts } from "@/utils/questions";

const MAX_VISIBLE_CHECKBOXES = 6;

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

  return getDisplayValue(values[cursorIndex], question.type, question.scaling);
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
  preselectedQuestionId?: number;
  isClosed?: boolean;
  actualCloseTime: number | null;
  withLegand?: boolean;
  chartHeight?: number;
  chartTheme?: VictoryThemeDefinition;
  defaultZoom?: TimelineChartZoomOption;
  embedMode?: boolean;
  hideCP?: boolean;
};

const ContinuousGroupTimeline: FC<Props> = ({
  questions,
  timestamps,
  preselectedQuestionId,
  isClosed,
  actualCloseTime,
  withLegand = true,
  chartTheme,
  defaultZoom,
  chartHeight,
  embedMode = false,
  hideCP,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const [choiceItems, setChoiceItems] = useState<ChoiceItem[]>(
    generateList(questions, preselectedQuestionId)
  );
  const userForecasts = user ? generateUserForecasts(questions) : undefined;
  const timestampsCount = timestamps.length;
  const prevTimestampsCount = usePrevious(timestampsCount);
  // sync BE driven data with local state
  useEffect(() => {
    if (prevTimestampsCount && prevTimestampsCount !== timestampsCount) {
      setChoiceItems(generateList(questions, preselectedQuestionId));
    }
  }, [questions, prevTimestampsCount, timestampsCount, preselectedQuestionId]);

  const [cursorTimestamp, tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  const tooltipChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      choiceItems
        .filter(({ active }) => active)
        .map(
          (
            { choice, values, color, timestamps: optionTimestamps, closeTime },
            index
          ) => {
            return {
              choiceLabel: choice,
              color,
              valueLabel: getQuestionTooltipLabel({
                timestamps: optionTimestamps ?? timestamps,
                values,
                cursorTimestamp,
                closeTime,
                question: questions[index],
              }),
            };
          }
        ),
    [choiceItems, cursorTimestamp, timestamps, questions]
  );

  const tooltipUserChoices = useMemo<ChoiceTooltipItem[]>(
    () =>
      userForecasts == null
        ? []
        : userForecasts?.map(
            (
              { choice, values, color, timestamps: optionTimestamps },
              index
            ) => {
              return {
                choiceLabel: choice,
                color,
                valueLabel: getQuestionTooltipLabel({
                  timestamps: optionTimestamps ?? timestamps,
                  values: values ?? [],
                  cursorTimestamp,
                  question: questions[index],
                  isUserPrediction: true,
                }),
              };
            }
          ),
    [userForecasts, cursorTimestamp, timestamps, questions]
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

  const zeroPoints: number[] = [];
  questions.forEach((question) => {
    if (question.scaling.zero_point !== null) {
      zeroPoints.push(question.scaling.zero_point);
    }
  });
  const scaling: Scaling = {
    range_max: Math.max(
      ...questions.map((question) => question.scaling.range_max!)
    ),
    range_min: Math.min(
      ...questions.map((question) => question.scaling.range_min!)
    ),
    zero_point: zeroPoints.length > 0 ? Math.min(...zeroPoints) : null,
  };
  // we can have mixes of log and linear scaled options
  // which leads to a derived zero point inside the range which is invalid
  // so just igore the log scaling in this case
  if (
    scaling.zero_point !== null &&
    scaling.range_min! <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max!
  ) {
    scaling.zero_point = null;
  }

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
      questionType={questions[0].type}
      scaling={scaling}
      title={t("forecastTimelineHeading")}
      yLabel={t("communityPredictionLabel")}
      chartTheme={chartTheme}
      embedMode={embedMode}
      chartHeight={chartHeight}
      withLegend={withLegand}
      defaultZoom={defaultZoom}
    />
  );
};

export default ContinuousGroupTimeline;
