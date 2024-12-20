"use client";

import { uniq } from "lodash";
import { isNil } from "lodash";
import { FC, useCallback, useState, memo, useMemo } from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import {
  AggregationMethod,
  AggregationQuestion,
  QuestionType,
  Scaling,
} from "@/types/question";
import {
  displayValue,
  findPreviousTimestamp,
  generateChoiceItemsFromAggregations,
  scaleInternalLocation,
} from "@/utils/charts";

import AggregationTooltip from "./aggregation_tooltip";

type Props = {
  questionData: AggregationQuestion;
  onTabChange: (activeTab: AggregationMethod) => void;
};

const AggregationsDrawer: FC<Props> = ({ questionData, onTabChange }) => {
  const { actual_close_time, scaling, type } = questionData;
  const actualCloseTime = useMemo(
    () => (actual_close_time ? new Date(actual_close_time).getTime() : null),
    [actual_close_time]
  );
  const [choiceItems, setChoiceItems] = useState(
    generateChoiceItemsFromAggregations(questionData)
  );
  const timestamps = useMemo(
    () =>
      uniq(
        choiceItems.reduce(
          (acc: number[], item: ChoiceItem) => [
            ...acc,
            ...(item.aggregationTimestamps ?? []),
          ],
          [
            ...(actualCloseTime
              ? [Math.min(actualCloseTime / 1000, new Date().getTime() / 1000)]
              : [new Date().getTime() / 1000]),
          ]
        )
      ).sort((a, b) => a - b),
    [choiceItems, actualCloseTime]
  );
  const [cursorTimestamp, _tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

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

  return (
    <>
      <MultipleChoiceChart
        timestamps={timestamps}
        actualCloseTime={actualCloseTime}
        choiceItems={choiceItems}
        onCursorChange={handleCursorChange}
        defaultZoom={TimelineChartZoomOption.All}
        aggregation
        withZoomPicker
        questionType={type}
        scaling={type === QuestionType.Binary ? undefined : scaling}
      />
      <div className="my-5 grid grid-cols-3 justify-items-center gap-x-5 gap-y-3">
        {choiceItems.map((choiceItem, idx) => {
          return (
            <AggregationTooltip
              key={idx}
              choiceItem={choiceItem}
              valueLabel={getQuestionTooltipLabel(
                choiceItem.aggregationTimestamps ?? timestamps,
                choiceItem.aggregationValues,
                cursorTimestamp,
                type,
                scaling
              )}
              onChoiceChange={handleChoiceChange}
              onChoiceHighlight={handleChoiceHighlight}
              onTabChange={onTabChange}
            />
          );
        })}
      </div>
    </>
  );
};

function getQuestionTooltipLabel(
  timestamps: number[],
  values: (number | null)[],
  cursorTimestamp: number | null,
  qType: QuestionType,
  scaling: Scaling
) {
  const hasValue =
    !isNil(cursorTimestamp) &&
    cursorTimestamp >= Math.min(...timestamps) &&
    cursorTimestamp <= Math.max(...timestamps);
  if (!hasValue) {
    return "?";
  }

  const closestTimestamp = findPreviousTimestamp(timestamps, cursorTimestamp);
  const cursorIndex = timestamps.findIndex(
    (timestamp) => timestamp === closestTimestamp
  );

  const cursorValue = values[cursorIndex];
  if (isNil(cursorValue)) {
    return "...";
  }

  if (qType === QuestionType.Binary) {
    return displayValue(cursorValue, qType);
  } else {
    const scaledValue = scaleInternalLocation(cursorValue, {
      range_min: scaling.range_min ?? 0,
      range_max: scaling.range_max ?? 1,
      zero_point: scaling.zero_point,
    });
    return displayValue(scaledValue, qType);
  }
}

export default memo(AggregationsDrawer);
