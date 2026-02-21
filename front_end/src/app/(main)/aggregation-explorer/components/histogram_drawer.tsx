import { FC, memo } from "react";

import Histogram from "@/components/charts/histogram";
import { AggregateForecastHistory, QuestionType } from "@/types/question";

import { AggregationExtraQuestion } from "../types";

type Props = {
  questionData: AggregationExtraQuestion;
  activeAggregation: AggregateForecastHistory;
  selectedTimestamp: number | null;
  aggregationIndex?: number;
};

const HistogramDrawer: FC<Props> = ({
  questionData,
  activeAggregation,
  selectedTimestamp,
  aggregationIndex,
}) => {
  if (
    [QuestionType.Binary, QuestionType.MultipleChoice].includes(
      questionData.type
    )
  ) {
    if (!activeAggregation || !selectedTimestamp) return null;

    const timestampIndex = activeAggregation.history.findLastIndex(
      (item) => item.start_time <= selectedTimestamp
    );
    const idx = aggregationIndex ?? 0;
    const histogram =
      activeAggregation.history[timestampIndex]?.histogram?.at(idx);
    const histogramData = histogram?.map((value, index) => ({
      x: index,
      y: value,
    }));

    const median =
      activeAggregation.history?.[timestampIndex]?.centers?.[idx];
    const mean = activeAggregation.history?.[timestampIndex]?.means?.[idx];

    return (
      histogramData && (
        <Histogram
          histogramData={histogramData}
          median={median}
          mean={mean}
          color={"gray"}
        />
      )
    );
  }

  return null;
};

export default memo(HistogramDrawer);
