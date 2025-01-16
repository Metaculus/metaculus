import { FC, memo } from "react";

import Histogram from "@/components/charts/histogram";
import { AggregateForecastHistory, QuestionType } from "@/types/question";

import { AggregationQuestionWithBots } from "../types";

type Props = {
  questionData: AggregationQuestionWithBots;
  activeAggregation: AggregateForecastHistory;
  selectedTimestamp: number | null;
};

const HistogramDrawer: FC<Props> = ({
  questionData,
  activeAggregation,
  selectedTimestamp,
}) => {
  if (questionData.type === QuestionType.Binary) {
    if (!activeAggregation || !selectedTimestamp) return null;

    const timestampIndex = activeAggregation.history.findIndex(
      (item) => item.start_time === selectedTimestamp
    );
    const histogramData = activeAggregation.history[
      timestampIndex
    ]?.histogram?.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median = activeAggregation.history?.[timestampIndex]?.centers?.[0];
    const mean = activeAggregation.history?.[timestampIndex]?.means?.[0];

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
