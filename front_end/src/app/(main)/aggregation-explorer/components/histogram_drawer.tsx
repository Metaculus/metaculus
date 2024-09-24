import { FC, memo } from "react";

import Histogram from "@/components/charts/histogram";
import {
  AggregationQuestion,
  Aggregations,
  QuestionType,
} from "@/types/question";

type Props = {
  questionData: AggregationQuestion;
  activeTab: keyof Aggregations;
  selectedTimestamp: number | null;
};

const HistogramDrawer: FC<Props> = ({
  questionData,
  activeTab,
  selectedTimestamp,
}) => {
  if (questionData.type === QuestionType.Binary) {
    const activeAggregation = questionData.aggregations[activeTab];

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
    const median = activeAggregation.history[timestampIndex].centers?.[0];
    const mean = activeAggregation.history[timestampIndex].means?.[0];

    return (
      histogramData && (
        <Histogram
          histogramData={histogramData}
          median={median}
          mean={mean}
          color={"green"}
        />
      )
    );
  }

  return null;
};

export default memo(HistogramDrawer);
