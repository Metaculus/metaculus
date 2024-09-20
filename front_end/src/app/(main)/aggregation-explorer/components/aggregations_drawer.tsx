"use client";

import { FC, useCallback, useState, memo, useMemo } from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import {
  AggregationQuestion,
  Aggregations,
  QuestionType,
  Scaling,
} from "@/types/question";
import {
  displayValue,
  findPreviousTimestamp,
  scaleInternalLocation,
} from "@/utils/charts";

import AggregationTooltip from "./aggregation_tooltip";

type Props = {
  questionData: AggregationQuestion;
  onTabChange: (activeTab: keyof Aggregations) => void;
};

const AggregationsDrawer: FC<Props> = ({ questionData, onTabChange }) => {
  const { aggregations, actual_close_time, scaling, type } = questionData;
  const timestamps = useMemo(
    () => getAggregationTimestamps(aggregations),
    [aggregations]
  );
  const actualCloseTime = useMemo(
    () => (actual_close_time ? new Date(actual_close_time).getTime() : null),
    [actual_close_time]
  );
  const [choiceItems, setChoiceItems] = useState(
    generateChoiceItemsFromAggregations(aggregations, scaling)
  );
  const [cursorTimestamp, _tooltipDate, handleCursorChange] =
    useTimestampCursor(timestamps);

  console.log(choiceItems);
  // console.log(timestamps);

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
      <div className="my-5 flex flex-wrap justify-between space-x-5">
        {choiceItems.map((choiceItem, idx) => {
          return (
            <AggregationTooltip
              key={idx}
              choiceItem={choiceItem}
              valueLabel={getQuestionTooltipLabel(
                choiceItem.timestamps ?? timestamps,
                choiceItem.values,
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

const getAggregationTimestamps = (aggregations: Aggregations) => {
  // Find populated aggregation and map timestamps
  for (const key in aggregations) {
    const aggregationKey = key as keyof Aggregations;
    const aggregation = aggregations[aggregationKey];

    if (aggregation?.history && !!aggregation.history.length) {
      return aggregation.history.map((forecast) => forecast.start_time);
    }
  }
  return [];
};

const generateChoiceItemsFromAggregations = (
  aggregations: Aggregations,
  scaling: Scaling
) => {
  const choiceItems = [];
  let index = 0;
  for (const key in aggregations) {
    const aggregationKey = key as keyof Aggregations;
    if (aggregationKey === "metaculus_prediction") continue;
    const aggregation = aggregations[aggregationKey];

    if (aggregation?.history && !!aggregation.history.length) {
      const item = {
        choice: key,
        values: aggregation.history.map((forecast) => forecast.centers![0]),
        minValues: aggregation.history.map(
          (forecast) => forecast.interval_lower_bounds![0]
        ),
        maxValues: aggregation.history.map(
          (forecast) => forecast.interval_upper_bounds![0]
        ),
        timestamps: aggregation.history.map((forecast) => forecast.start_time),
        color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
        active: true,
        resolution: undefined,
        highlighted: false,
        rangeMin: scaling.range_min ?? 0,
        rangeMax: scaling.range_max ?? 1,
        scaling,
      };
      choiceItems.push(item);
      index++;
    }
  }
  return choiceItems;
};

function getQuestionTooltipLabel(
  timestamps: number[],
  values: number[],
  cursorTimestamp: number,
  qType: QuestionType,
  scaling: Scaling
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

  if (values[cursorIndex] === undefined) {
    return "...";
  }

  if (qType === QuestionType.Binary) {
    return displayValue(values[cursorIndex], qType);
  } else {
    const scaledValue = scaleInternalLocation(values[cursorIndex], {
      range_min: scaling.range_min ?? 0,
      range_max: scaling.range_max ?? 1,
      zero_point: scaling.zero_point,
    });
    return displayValue(scaledValue, qType);
  }
}

export default memo(AggregationsDrawer);
