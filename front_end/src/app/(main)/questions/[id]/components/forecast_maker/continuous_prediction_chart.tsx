import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
} from "@/components/charts/continuous_area_chart";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
} from "@/types/charts";
import { QuestionStatus } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";
import { cdfToPmf } from "@/utils/math";

type Props = {
  question: QuestionWithNumericForecasts;
  overlayPreviousForecast?: boolean;
  dataset: {
    cdf: number[];
    pmf: number[];
  };
  graphType: ContinuousAreaGraphType;
  readOnly?: boolean;
  height?: number;
  width?: number;
  showCP?: boolean;
};

const ContinuousPredictionChart: FC<Props> = ({
  question,
  overlayPreviousForecast,
  dataset,
  graphType,
  readOnly = false,
  height = 300,
  showCP = true,
  width = undefined,
}) => {
  const t = useTranslations();

  const [hoverState, setHoverState] = useState<ContinuousAreaHoverState | null>(
    null
  );

  const cursorDisplayData = useMemo(() => {
    if (!hoverState) return null;

    const xLabel = getDisplayValue({
      value: hoverState.x,
      questionType: question.type,
      scaling: question.scaling,
      precision: 5,
    });
    return {
      xLabel,
      yUserLabel: !hoverState.yData.user
        ? null
        : graphType === "pmf"
          ? (hoverState.yData.user * 200).toFixed(3)
          : getForecastPctDisplayValue(hoverState.yData.user),
      yUserPreviousLabel: readOnly
        ? null
        : !hoverState.yData.user_previous
          ? null
          : graphType === "pmf"
            ? (hoverState.yData.user_previous * 200).toFixed(3)
            : getForecastPctDisplayValue(hoverState.yData.user_previous),
      yCommunityLabel: !hoverState.yData.community
        ? null
        : graphType === "pmf"
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
    const latest = question.aggregations.recency_weighted.latest;
    if (showCP && latest && !latest.end_time) {
      charts.push({
        pmf: cdfToPmf(latest.forecast_values),
        cdf: latest.forecast_values,
        type:
          question.status === QuestionStatus.CLOSED
            ? "community_closed"
            : "community",
      });
    }

    if (overlayPreviousForecast && question.my_forecasts?.latest) {
      charts.push({
        pmf: cdfToPmf(question.my_forecasts.latest.forecast_values),
        cdf: question.my_forecasts.latest.forecast_values,
        type: "user_previous",
      });
    }

    if (!readOnly || !!question.my_forecasts?.latest) {
      charts.push({
        pmf: dataset.pmf,
        cdf: dataset.cdf,
        type: "user",
      });
    }

    return charts;
  }, [
    question.aggregations.recency_weighted.latest,
    question.status,
    dataset.cdf,
    dataset.pmf,
    readOnly,
    showCP,
    question.my_forecasts?.latest,
    overlayPreviousForecast,
  ]);

  return (
    <>
      <ContinuousAreaChart
        height={height}
        width={width}
        scaling={question.scaling}
        questionType={question.type}
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
        resolution={question.resolution}
        unit={question.unit}
      />
      <div className="my-2 flex min-h-4 justify-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
        {cursorDisplayData && (
          <>
            <span>
              {graphType === "pmf" ? "P(x = " : "P(x < "}
              <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                {cursorDisplayData.xLabel}
                {question.unit && ` ${question.unit}`}
              </span>
              {"):"}
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
            {cursorDisplayData.yUserPreviousLabel !== null && (
              <span>
                <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                  {cursorDisplayData.yUserPreviousLabel}
                </span>
                {" ("}
                {t("youPrevious")}
                {")"}
              </span>
            )}
            {showCP && cursorDisplayData.yCommunityLabel && (
              <span>
                <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                  {cursorDisplayData.yCommunityLabel}
                </span>
                {" ("}
                {t("community")}
                {")"}
              </span>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ContinuousPredictionChart;
