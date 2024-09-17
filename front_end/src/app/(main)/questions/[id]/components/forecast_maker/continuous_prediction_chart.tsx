import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
} from "@/components/charts/continuous_area_chart";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
} from "@/types/charts";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";
import { cdfToPmf } from "@/utils/math";

type Props = {
  question: QuestionWithNumericForecasts;
  dataset: {
    cdf: number[];
    pmf: number[];
  };
  graphType: ContinuousAreaGraphType;
  readOnly?: boolean;
  height?: number;
};

const ContinuousPredictionChart: FC<Props> = ({
  question,
  dataset,
  graphType,
  readOnly = false,
  height = 300,
}) => {
  const t = useTranslations();

  const [hoverState, setHoverState] = useState<ContinuousAreaHoverState | null>(
    null
  );

  const cursorDisplayData = useMemo(() => {
    if (!hoverState) return null;

    const xLabel = getDisplayValue(hoverState.x, question);
    return {
      xLabel,
      yUserLabel: readOnly
        ? null
        : graphType === "pmf"
          ? (hoverState.yData.user * 200).toFixed(3)
          : getForecastPctDisplayValue(hoverState.yData.user),
      yCommunityLabel:
        graphType === "pmf"
          ? (hoverState.yData.community * 200).toFixed(3)
          : getForecastPctDisplayValue(hoverState.yData.community),
    };
  }, [graphType, hoverState, question, readOnly]);

  const handleCursorChange = useCallback(
    (value: ContinuousAreaHoverState | null) => {
      setHoverState(value);
    },
    []
  );

  const data: ContinuousAreaGraphInput = useMemo(() => {
    const charts: ContinuousAreaGraphInput = [];
    if (question.aggregations.recency_weighted.latest) {
      charts.push({
        pmf: cdfToPmf(
          question.aggregations.recency_weighted.latest.forecast_values
        ),
        cdf: question.aggregations.recency_weighted.latest.forecast_values,
        type: "community",
      });
    }

    if (!readOnly) {
      charts.push({
        pmf: dataset.pmf,
        cdf: dataset.cdf,
        type: "user",
      });
    }

    return charts;
  }, [
    question.aggregations.recency_weighted.latest,
    dataset.cdf,
    dataset.pmf,
    readOnly,
  ]);

  return (
    <>
      <ContinuousAreaChart
        height={height}
        scaling={question.scaling}
        questionType={question.type}
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
        resolution={question.resolution}
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
    </>
  );
};

export default ContinuousPredictionChart;
