"use client";

import { FC, useCallback, useState } from "react";
import DetailedQuestionCard from "../../questions/[id]/components/detailed_question_card";
import { AggregationQuestion, Aggregations, Scaling } from "@/types/question";
import useContainerSize from "@/hooks/use_container_size";
import useAppTheme from "@/hooks/use_app_theme";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import MultipleChoiceChart from "@/components/charts/multiple_choice_chart";
import { TimelineChartZoomOption } from "@/types/charts";
import ChoicesLegend from "../../questions/[id]/components/choices_legend";

type Props = {
  questionData: AggregationQuestion;
};

const AggregationsDrawer: FC<Props> = ({ questionData }) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { aggregations, actual_close_time, scaling } = questionData;
  const { theme, getThemeColor } = useAppTheme();
  const actualTheme = theme === "dark" ? darkTheme : lightTheme;
  const timestamps = getAggregationTimestamps(aggregations);
  const actualCloseTime = actual_close_time
    ? new Date(actual_close_time).getTime()
    : null;
  const [choiceItems, setChoiceItems] = useState(
    generateChoiceItemsFromAggregations(aggregations, scaling)
  );
  // const choiceItems = generateChoiceItemsFromAggregations(
  //   aggregations,
  //   scaling
  // );
  console.log(timestamps);
  console.log(choiceItems);

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
    <>
      <MultipleChoiceChart
        timestamps={timestamps}
        actualCloseTime={actualCloseTime}
        choiceItems={choiceItems}
        // yLabel={t("communityPredictionLabel")}
        // onChartReady={handleChartReady}
        // onCursorChange={handleCursorChange}
        defaultZoom={TimelineChartZoomOption.All}
        // withZoomPicker
        // userForecasts={userForecasts}
        // isClosed={isClosed}
      />

      <div className="mt-3">
        <ChoicesLegend
          choices={choiceItems}
          onChoiceChange={handleChoiceChange}
          onChoiceHighlight={handleChoiceHighlight}
          maxLegendChoices={4}
          onToggleAll={toggleSelectAll}
        />
      </div>
    </>
  );
};

export default AggregationsDrawer;

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
