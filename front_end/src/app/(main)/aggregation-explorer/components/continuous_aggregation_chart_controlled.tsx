"use client";

import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
} from "@/components/charts/continuous_area_chart";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
} from "@/types/charts";
import {
  GraphingQuestionProps,
  NumericAggregateForecastHistory,
} from "@/types/question";
import {
  getForecastPctDisplayValue,
  getPredictionDisplayValue,
} from "@/utils/formatters/prediction";
import { cdfToPmf } from "@/utils/math";
import { formatValueUnit } from "@/utils/questions/units";

import { NumericAggregationExtraQuestion } from "../types";

type Props = {
  questionData: NumericAggregationExtraQuestion;
  activeAggregation: NumericAggregateForecastHistory;
  selectedTimestamp: number | null;
  graphType: ContinuousAreaGraphType;
  chartHeight?: number;
};

const ContinuousAggregationChartControlled: FC<Props> = ({
  questionData,
  activeAggregation,
  selectedTimestamp,
  graphType,
  chartHeight = 150,
}) => {
  const t = useTranslations();
  const { scaling, type: qType } = questionData;
  const [hoverState, setHoverState] = useState<ContinuousAreaHoverState | null>(
    null
  );

  const cursorDisplayData = useMemo(() => {
    if (!hoverState) return null;

    const xLabel = getPredictionDisplayValue(hoverState.x, {
      scaling: {
        range_min: scaling.range_min ?? 0,
        range_max: scaling.range_max ?? 1,
        zero_point: scaling.zero_point,
      },
      questionType: qType,
      precision: 5,
      actual_resolve_time: null,
    });
    return {
      xLabel,
      yCommunityLabel:
        graphType === "pmf"
          ? ((hoverState.yData.community ?? 0) * 200).toFixed(3)
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
      const timestampIndex = isNil(selectedTimestamp)
        ? -1
        : activeAggregation.history.findLastIndex(
            (item) => item.start_time <= selectedTimestamp
          );
      const historyItem =
        timestampIndex === -1
          ? activeAggregation.history.at(-1)
          : activeAggregation.history[timestampIndex];

      if (historyItem) {
        charts.push({
          pmf: cdfToPmf(historyItem.forecast_values),
          cdf: historyItem.forecast_values,
          type: "community",
        });
      }
    }

    return charts;
  }, [selectedTimestamp, activeAggregation]);

  const xLabel = cursorDisplayData?.xLabel ?? "";
  let probabilityLabel: string;
  if (graphType === "pmf") {
    if (xLabel.includes("<") || xLabel.includes(">")) {
      probabilityLabel = xLabel.at(0) + " " + xLabel.slice(1);
    } else {
      probabilityLabel = "= " + xLabel;
    }
  } else {
    if (xLabel.includes("<")) {
      probabilityLabel = "< " + xLabel.slice(1);
    } else if (xLabel.includes(">")) {
      probabilityLabel = "≤ ∞";
    } else {
      probabilityLabel = "≤ " + xLabel;
    }
  }

  return (
    <div>
      <ContinuousAreaChart
        height={chartHeight}
        question={
          {
            ...questionData,
            resolution: null,
          } as unknown as GraphingQuestionProps
        }
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
      />
      <div className="my-2 flex min-h-4 justify-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
        {cursorDisplayData && (
          <>
            <span>
              {"P(x "}
              <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                {formatValueUnit(probabilityLabel, questionData.unit)}
              </span>
              {"):"}
            </span>
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

export default ContinuousAggregationChartControlled;
