import { fromUnixTime } from "date-fns";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
} from "@/components/charts/continuous_area_chart";
import InlineSelect from "@/components/ui/inline_select";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
} from "@/types/charts";
import { AggregationQuestion, Aggregations } from "@/types/question";
import { displayValue, scaleInternalLocation } from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";
import { cdfToPmf } from "@/utils/math";

type Props = {
  questionData: AggregationQuestion;
  activeTab: keyof Aggregations;
  selectedTimestamp: number;
};

const ContinuousAggregationChart: FC<Props> = ({
  questionData,
  activeTab,
  selectedTimestamp,
}) => {
  const t = useTranslations();
  const { scaling, type: qType, aggregations } = questionData;
  const activeAggregation = aggregations[activeTab];
  const [graphType, setGraphType] = useState<ContinuousAreaGraphType>("pmf");
  const [hoverState, setHoverState] = useState<ContinuousAreaHoverState | null>(
    null
  );

  const cursorDisplayData = useMemo(() => {
    if (!hoverState) return null;

    const scaledValue = scaleInternalLocation(hoverState.x, {
      range_min: scaling.range_min ?? 0,
      range_max: scaling.range_max ?? 1,
      zero_point: scaling.zero_point,
    });
    const xLabel = displayValue(scaledValue, qType);
    return {
      xLabel,
      yUserLabel: null,
      yCommunityLabel:
        graphType === "pmf"
          ? (hoverState.yData.community * 200).toFixed(3)
          : getForecastPctDisplayValue(hoverState.yData.community),
    };
  }, [graphType, hoverState, scaling, qType]);

  const handleCursorChange = useCallback(
    (value: ContinuousAreaHoverState | null) => {
      setHoverState(value);
    },
    []
  );

  const data: ContinuousAreaGraphInput = useMemo(() => {
    const charts: ContinuousAreaGraphInput = [];
    if (activeAggregation) {
      const timestampIndex = activeAggregation.history.findIndex(
        (item) => item.start_time === selectedTimestamp
      );
      charts.push({
        pmf: cdfToPmf(
          activeAggregation.history[timestampIndex].forecast_values
        ),
        cdf: activeAggregation.history[timestampIndex].forecast_values,
        type: "community",
      });
    }

    return charts;
  }, [selectedTimestamp, activeAggregation]);

  return (
    <div className="my-5">
      <div className="flex">
        <InlineSelect<ContinuousAreaGraphType>
          options={[
            { label: t("pdfLabel"), value: "pmf" },
            { label: t("cdfLabel"), value: "cdf" },
          ]}
          defaultValue={graphType}
          className="appearance-none border-none !p-0 text-sm"
          onChange={(e) =>
            setGraphType(e.target.value as ContinuousAreaGraphType)
          }
        />
        <p className="m-0 ml-auto">
          Selected timestamp: {fromUnixTime(selectedTimestamp).toDateString()}
        </p>
      </div>
      <ContinuousAreaChart
        height={150}
        scaling={scaling}
        questionType={qType}
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
        resolution={null}
      />
      <div className="my-2 flex min-h-4 justify-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
        {cursorDisplayData && (
          <>
            <span>
              {graphType === "pmf" ? "P(x = " : "P(x < "}
              <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                {cursorDisplayData.xLabel}
              </span>
              {" ):"}
            </span>
            {cursorDisplayData.yUserLabel !== null && (
              <span>
                <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                  {cursorDisplayData.yUserLabel}
                </span>
                {" ("}
                {t("you")}
                {")"}
              </span>
            )}
            <span>
              <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                {cursorDisplayData.yCommunityLabel}
              </span>
              {" ("}
              {t("community")}
              {")"}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ContinuousAggregationChart;
