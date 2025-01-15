"use client";

import { uniq } from "lodash";
import { isNil } from "lodash";
import {
  FC,
  useCallback,
  useState,
  memo,
  useMemo,
  Dispatch,
  SetStateAction,
  useEffect,
} from "react";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import {
  AggregationMethod,
  AggregationMethodWithBots,
  aggregationMethodLabel,
  aggregationMethodsArray,
  AggregationQuestionWithBots,
  QuestionType,
  Scaling,
} from "@/types/question";
import {
  displayValue,
  findPreviousTimestamp,
  generateChoiceItemsFromAggregations,
  scaleInternalLocation,
} from "@/utils/charts";

import AggregationTooltip from "./aggregations_tooltip";
import { AggregationMethodInfo } from "./explorer";

type Props = {
  aggregationMethods: AggregationMethodInfo[];
  onTabChange: (activeTab: AggregationMethodWithBots) => void;
  setAggregationMethods: Dispatch<SetStateAction<AggregationMethodInfo[]>>;
  onFetchData: ({
    postId,
    questionId,
    includeBots,
    aggregationMethod,
  }: {
    postId: string;
    questionId?: string | null;
    includeBots?: boolean;
    aggregationMethod: AggregationMethod;
  }) => Promise<void>;
  aggregationData: AggregationQuestionWithBots | null;
  postId: number;
  questionId?: number | null;
};

const AggregationsDrawer: FC<Props> = ({
  onTabChange,
  setAggregationMethods,
  aggregationMethods,
  onFetchData,
  aggregationData,
  postId,
  questionId,
}) => {
  const { actual_close_time, scaling, type } = aggregationData ?? {};
  const actualCloseTime = useMemo(
    () => (actual_close_time ? new Date(actual_close_time).getTime() : null),
    [actual_close_time]
  );
  const tooltips = useMemo(
    () => generateAggregationTooltips(aggregationMethodsArray),
    []
  );
  const [choiceItems, setChoiceItems] = useState(
    aggregationData
      ? generateChoiceItemsFromAggregations(aggregationData, tooltips)
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
  useEffect(() => {
    if (aggregationData) {
      const newChoiceItems = generateChoiceItemsFromAggregations(
        aggregationData,
        tooltips
      );

      setChoiceItems((prevItems) => {
        // Create a map of existing items by choice for quick lookup
        const existingItemsMap = new Map(
          prevItems.map((item) => [item.choice, item])
        );

        // Update or create new items while preserving existing state
        return newChoiceItems.map((newItem) => {
          const existingItem = existingItemsMap.get(newItem.choice);
          if (existingItem) {
            // Preserve active and highlighted states from existing item
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
  }, [aggregationData, tooltips]);

  return (
    <>
      {aggregationData && (
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
      )}
      <div className="my-5 grid grid-cols-3 justify-items-center gap-x-5 gap-y-3">
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
                  ? getQuestionTooltipLabel(
                      choiceItem.aggregationTimestamps,
                      choiceItem.aggregationValues,
                      cursorTimestamp,
                      // TODO: fix types
                      type as QuestionType,
                      scaling as Scaling
                    )
                  : ""
              }
              aggregationMethods={aggregationMethods}
              setAggregationMethods={setAggregationMethods}
              onFetchData={onFetchData}
              onChoiceChange={handleChoiceChange}
              onChoiceHighlight={handleChoiceHighlight}
              onTabChange={onTabChange}
              postId={postId}
              questionId={questionId}
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

function generateAggregationTooltips(
  aggregationMethodsArray: AggregationMethod[]
) {
  return aggregationMethodsArray.flatMap((aggregationMethod, index) => {
    const localIndex = index === 0 ? 0 : index * 2;
    return [
      {
        aggregationMethod,
        choice: aggregationMethod as unknown as AggregationMethodWithBots,
        label: aggregationMethodLabel[aggregationMethod],
        includeBots: false,
        color:
          MULTIPLE_CHOICE_COLOR_SCALE[localIndex] ?? METAC_COLORS.gray["400"],
      },
      {
        aggregationMethod,
        choice: `${aggregationMethod}_bot` as AggregationMethodWithBots,
        label: aggregationMethodLabel[`${aggregationMethod}_bot`],
        includeBots: true,
        color:
          MULTIPLE_CHOICE_COLOR_SCALE[localIndex + 1] ??
          METAC_COLORS.gray["400"],
      },
    ];
  });
}

export default memo(AggregationsDrawer);
