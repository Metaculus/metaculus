"use client";

import { FC, useCallback, useState, memo, useMemo } from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import {
  AggregationMethod,
  AggregationQuestion,
  Aggregations,
  QuestionType,
  Scaling,
} from "@/types/question";
import { ChoiceItem } from "@/types/choices";
import {
  displayValue,
  findPreviousTimestamp,
  scaleInternalLocation,
} from "@/utils/charts";

import AggregationTooltip from "./aggregation_tooltip";

type Props = {
  questionData: AggregationQuestion;
  onTabChange: (activeTab: AggregationMethod) => void;
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
    generateChoiceItemsFromAggregations(aggregations, scaling, type)
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

const getAggregationTimestamps = (aggregations: Aggregations) => {
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
  scaling: Scaling,
  qType: QuestionType
): ChoiceItem[] => {
  const choiceItems: ChoiceItem[] = [];
  let index = 0;
  for (const key in aggregations) {
    const aggregationKey = key as keyof Aggregations;
    const aggregation = aggregations[aggregationKey];

    if (aggregation?.history && !!aggregation.history.length) {
      const item = {
        choice: key,
        aggregationTimestamps: aggregation.history.map(
          (forecast) => forecast.start_time
        ),
        aggregationValues:
          aggregationKey === AggregationMethod.metaculus_prediction &&
          qType === QuestionType.Binary
            ? aggregation.history.map(
                (forecast) => forecast.forecast_values?.[1] ?? 0
              )
            : aggregation.history.map((forecast) => forecast.centers?.[0] ?? 0),
        aggregationMinValues: aggregation.history.map(
          (forecast) => forecast.interval_lower_bounds?.[0] ?? 0
        ),
        aggregationMaxValues: aggregation.history.map(
          (forecast) => forecast.interval_upper_bounds?.[0] ?? 0
        ),
        aggregationForecasterCounts: aggregation.history.map(
          (forecast) => forecast.forecaster_count ?? 0
        ),
        userValues: [],
        userTimestamps: [],
        color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
        active: true,
        resolution: null,
        highlighted: false,
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
  values: (number | null)[],
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

  const val = values[cursorIndex];
  if (val === null) {
    return "...";
  }
  if (qType === QuestionType.Binary) {
    return displayValue(val, qType);
  } else {
    const scaledValue = scaleInternalLocation(val, {
      range_min: scaling.range_min ?? 0,
      range_max: scaling.range_max ?? 1,
      zero_point: scaling.zero_point,
    });
    return displayValue(scaledValue, qType);
  }
}

export default memo(AggregationsDrawer);
