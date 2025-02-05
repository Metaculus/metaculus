"use client";

import { saveAs } from "file-saver";
import { uniq } from "lodash";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState, memo, useMemo, useEffect } from "react";
import toast from "react-hot-toast";

import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import Button from "@/components/ui/button";
import useTimestampCursor from "@/hooks/use_timestamp_cursor";
import { TimelineChartZoomOption } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { AggregationMethod, QuestionType, Scaling } from "@/types/question";
import {
  displayValue,
  findPreviousTimestamp,
  scaleInternalLocation,
} from "@/utils/charts";
import { base64ToBlob } from "@/utils/files";

import AggregationTooltip from "./aggregation_tooltip";
import { getAggregationsPostZipData } from "../actions";
import { AGGREGATION_EXPLORER_OPTIONS } from "../constants";
import {
  generateAggregationTooltips,
  generateChoiceItemsFromAggregations,
} from "../helpers";
import {
  AggregationMethodWithBots,
  AggregationQuestionWithBots,
} from "../types";

type Props = {
  onTabChange: (activeTab: AggregationMethodWithBots) => void;
  onFetchData: (
    aggregationOptionId: AggregationMethodWithBots
  ) => Promise<void>;
  aggregationData: AggregationQuestionWithBots | null;
  selectedSubQuestionOption: number | string | null;
  postId: number;
  questionTitle: string;
};

const AggregationsDrawer: FC<Props> = ({
  onTabChange,
  onFetchData,
  aggregationData,
  selectedSubQuestionOption,
  postId,
  questionTitle,
}) => {
  const t = useTranslations();
  const { actual_close_time, scaling, type } = aggregationData ?? {};
  const actualCloseTime = useMemo(
    () => (actual_close_time ? new Date(actual_close_time).getTime() : null),
    [actual_close_time]
  );
  const tooltips = useMemo(() => generateAggregationTooltips(), []);
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

  // TODO: add support for include_bots
  const handleDownloadQuestionData = async () => {
    try {
      const aggregationMethods = uniq(
        choiceItems
          .filter((item) => item.active)
          .map(
            (item) =>
              AGGREGATION_EXPLORER_OPTIONS.find(
                (option) => option.id === item.choice
              )?.value
          )
      ).filter((method) => method !== undefined);

      const base64 = await getAggregationsPostZipData(
        postId,
        typeof selectedSubQuestionOption === "number"
          ? selectedSubQuestionOption
          : undefined,
        aggregationMethods as AggregationMethod[]
      );

      const blob = base64ToBlob(base64);
      const filename = `${questionTitle.replaceAll(" ", "_")}.zip`;
      saveAs(blob, filename);
    } catch (error) {
      toast.error(t("downloadQuestionDataError") + error);
    }
  };

  return (
    <>
      <Button
        variant="text"
        onClick={handleDownloadQuestionData}
        className="ml-12 cursor-pointer p-0 text-sm text-gray-500 underline dark:text-gray-500-dark"
      >
        {t("downloadQuestionData")}
      </Button>

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
                  ? getQuestionTooltipLabel(
                      choiceItem.aggregationTimestamps,
                      choiceItem.aggregationValues,
                      cursorTimestamp,
                      type,
                      scaling
                    )
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

function getQuestionTooltipLabel(
  timestamps: number[],
  values: (number | null)[],
  cursorTimestamp: number | null,
  qType?: QuestionType,
  scaling?: Scaling
) {
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
  if (isNil(cursorValue)) {
    return "...";
  }

  if (qType === QuestionType.Binary) {
    return displayValue(cursorValue, qType);
  } else {
    const scaledValue = scaleInternalLocation(cursorValue, {
      range_min: scaling?.range_min ?? 0,
      range_max: scaling?.range_max ?? 1,
      zero_point: scaling?.zero_point ?? null,
    });
    return displayValue(scaledValue, qType ?? QuestionType.Numeric);
  }
}

export default memo(AggregationsDrawer);
