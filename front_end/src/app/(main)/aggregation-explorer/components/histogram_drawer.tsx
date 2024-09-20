import { fromUnixTime } from "date-fns";
import { memo } from "react";

import Histogram from "@/components/charts/histogram";
import { AggregationQuestion, Aggregations } from "@/types/question";

type Props = {
  questionData: AggregationQuestion;
  activeTab: keyof Aggregations;
  selectedTimestamp: number;
};

const HistogramDrawer: React.FC<Props> = ({
  questionData,
  activeTab,
  selectedTimestamp,
}) => {
  if (questionData.type === "binary") {
    const activeAggregation = questionData.aggregations[activeTab];

    if (!activeAggregation) return null;

    const timestampIndex = activeAggregation.history.findIndex(
      (item) => item.start_time === selectedTimestamp
    );
    console.log(selectedTimestamp);
    console.log(timestampIndex);
    // const lastHistogramIndex = activeAggregation.history.length - 1;
    const histogramData = activeAggregation.history[
      timestampIndex
    ].histogram!.map((value, index) => ({
      x: index,
      y: value,
    }));
    const median = activeAggregation.history[timestampIndex].centers![0];
    const mean = activeAggregation.history[timestampIndex].means![0];

    return (
      <>
        <div>
          Selected timestamp: {fromUnixTime(selectedTimestamp).toDateString()}
        </div>
        <Histogram
          histogramData={histogramData}
          median={median}
          mean={mean}
          color={"green"}
        />
      </>
    );
  }
};

export default memo(HistogramDrawer);
