"use client";

import { uniq } from "lodash";
import { isNil } from "lodash";
import {
  FC,
  useCallback,
  useState,
  memo,
  useMemo,
  useEffect,
  useRef,
} from "react";

import GroupChart from "@/components/charts/group_chart";
import { useAuth } from "@/contexts/auth_context";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { QuestionType, Scaling } from "@/types/question";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { getPostDrivenTime } from "@/utils/questions/helpers";

import AggregationTooltip from "./aggregation_tooltip";
import {
  generateAggregationTooltips,
  generateChoiceItemsFromAggregations,
} from "../helpers";
import { AggregationExtraMethod, AggregationExtraQuestion } from "../types";

type Props = {
  onTabChange: (activeTab: AggregationExtraMethod) => void;
  onFetchData: (aggregationOptionId: AggregationExtraMethod) => Promise<void>;
  aggregationData: AggregationExtraQuestion | null;
  selectedSubQuestionOption: number | string | null;
  joinedBeforeDate?: string;
};

const AggregationsDrawer: FC<Props> = ({
  onTabChange,
  onFetchData,
  aggregationData,
  selectedSubQuestionOption,
  joinedBeforeDate,
}) => {
  const { user } = useAuth();
  const { actual_close_time, scaling, type, actual_resolve_time } =
    aggregationData ?? {};
  const actualCloseTime = useMemo(
    () => getPostDrivenTime(actual_close_time),
    [actual_close_time]
  );
  const tooltips = useMemo(
    () => generateAggregationTooltips(user, joinedBeforeDate),
    [joinedBeforeDate, user]
  );
  const [choiceItems, setChoiceItems] = useState(
    aggregationData
      ? generateChoiceItemsFromAggregations({
          question: aggregationData,
          tooltips,
          selectedSubQuestionOption,
        })
      : []
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
  const isInteracted = useRef(false);

  const handleChoiceChange = useCallback((choice: string, checked: boolean) => {
    if (!isInteracted.current) {
      isInteracted.current = true;
    }
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
  useEffect(() => {
    if (aggregationData) {
      const newChoiceItems = generateChoiceItemsFromAggregations({
        question: aggregationData,
        tooltips,
        selectedSubQuestionOption,
      });

      // Update or create new items while preserving existing state
      setChoiceItems((prevItems) => {
        const existingItemsMap = new Map(
          prevItems.map((item) => [item.choice, item])
        );

        return newChoiceItems.map((newItem) => {
          const existingItem = existingItemsMap.get(newItem.choice);
          if (existingItem) {
            return {
              ...newItem,
              active: existingItem.active,
              highlighted: existingItem.highlighted,
            };
          }
          return newItem;
        });
      });
    }
  }, [aggregationData, selectedSubQuestionOption, tooltips]);

  return (
    <>
      {aggregationData && (
        <GroupChart
          timestamps={timestamps}
          actualCloseTime={actualCloseTime}
          choiceItems={choiceItems}
          onCursorChange={handleCursorChange}
          defaultZoom={TimelineChartZoomOption.All}
          aggregation
          withZoomPicker
          questionType={type}
          scaling={type === QuestionType.Binary ? undefined : scaling}
          forceAutoZoom={isInteracted.current}
        />
      )}
      <div className="my-5 grid grid-cols-1 justify-items-center gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {tooltips.map((tooltip, index) => {
          const choiceItem = choiceItems.find(
            (item) => item.choice === tooltip.choice
          );

          return (
            <AggregationTooltip
              key={index}
              tooltips={tooltip}
              choiceItems={choiceItems}
              valueLabel={
                choiceItem?.active
                  ? getQuestionTooltipLabel({
                      timestamps: choiceItem.aggregationTimestamps,
                      values: choiceItem.aggregationValues,
                      cursorTimestamp,
                      qType: type,
                      scaling,
                      actual_resolve_time: actual_resolve_time ?? null,
                    })
                  : ""
              }
              onFetchData={onFetchData}
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

function getQuestionTooltipLabel({
  timestamps,
  values,
  cursorTimestamp,
  qType,
  scaling,
  actual_resolve_time,
}: {
  timestamps: number[];
  values: (number | null)[];
  cursorTimestamp: number | null;
  qType?: QuestionType;
  scaling?: Scaling;
  actual_resolve_time: string | null;
}) {
  const hasValue =
    !isNil(cursorTimestamp) && cursorTimestamp >= Math.min(...timestamps);
  if (!hasValue) {
    return "?";
  }

  const closestTimestamp = findPreviousTimestamp(timestamps, cursorTimestamp);
  const cursorIndex = timestamps.findIndex(
    (timestamp) => timestamp === closestTimestamp
  );
  const cursorValue = values[cursorIndex];

  const normalizedScaling: Scaling = {
    range_min: scaling?.range_min ?? 0,
    range_max: scaling?.range_max ?? 1,
    zero_point: scaling?.zero_point ?? null,
  };
  return getPredictionDisplayValue(cursorValue, {
    questionType: qType ?? QuestionType.Numeric,
    scaling: normalizedScaling,
    actual_resolve_time,
  });
}

export default memo(AggregationsDrawer);
