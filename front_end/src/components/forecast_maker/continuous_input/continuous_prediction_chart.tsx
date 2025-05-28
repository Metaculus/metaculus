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
import {
  DefaultInboundOutcomeCount,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  getDiscreteValueOptions,
  getForecastPctDisplayValue,
  getPredictionDisplayValue,
} from "@/utils/formatters/prediction";
import { cdfToPmf } from "@/utils/math";
import { formatValueUnit } from "@/utils/questions/units";

type Props = {
  question: QuestionWithNumericForecasts;
  overlayPreviousForecast?: boolean;
  dataset: {
    cdf: number[];
    pmf: number[];
    componentCdfs?: number[][] | null;
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

  const discreteValueOptions = getDiscreteValueOptions(question);

  const cursorDisplayData = useMemo(() => {
    if (!hoverState) return null;

    function getYLabel(yDataValue: number | null) {
      if (!yDataValue) return null;
      return graphType === "pmf" && question.type !== QuestionType.Discrete
        ? (
            yDataValue *
            (question.inbound_outcome_count ?? DefaultInboundOutcomeCount)
          ).toFixed(3)
        : getForecastPctDisplayValue(yDataValue);
    }

    const xLabel = getPredictionDisplayValue(hoverState.x, {
      questionType: question.type,
      scaling: question.scaling,
      precision: 5,
      actual_resolve_time: question.actual_resolve_time ?? null,
      skipQuartilesBorders: question.type !== QuestionType.Discrete,
      discreteValueOptions,
    });

    const communityValue =
      hoverState.yData.community || hoverState.yData.community_closed;
    return {
      xLabel,
      yUserLabel: getYLabel(hoverState.yData.user),
      yUserPreviousLabel: readOnly
        ? null
        : getYLabel(hoverState.yData.user_previous),
      yCommunityLabel: getYLabel(communityValue),
    };
  }, [graphType, hoverState, question, readOnly, discreteValueOptions]);

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
        componentCdfs: dataset.componentCdfs,
        type: "user",
      });
    }

    return charts;
  }, [
    question.aggregations.recency_weighted.latest,
    question.status,
    dataset,
    readOnly,
    showCP,
    question.my_forecasts?.latest,
    overlayPreviousForecast,
  ]);

  const xLabel = cursorDisplayData?.xLabel ?? "";
  let probabilityLabel: string;
  if (graphType === "pmf") {
    if (xLabel.includes("<") || xLabel.includes(">")) {
      probabilityLabel = xLabel.at(0) + " " + xLabel.slice(1);
    } else {
      probabilityLabel = "= " + xLabel;
    }
  } else {
    // cdf
    if (xLabel.includes("<")) {
      probabilityLabel = "< " + xLabel.slice(1);
    } else if (xLabel.includes(">")) {
      probabilityLabel = "≤ ∞";
    } else {
      probabilityLabel = "≤ " + xLabel;
    }
  }

  return (
    <>
      <ContinuousAreaChart
        height={height}
        width={width}
        question={question}
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
        readOnly={readOnly}
      />
      <div className="my-2 flex min-h-4 justify-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
        {cursorDisplayData && (
          <>
            <span>
              {"P(x "}
              <span className="font-bold text-gray-900 dark:text-gray-900-dark">
                {formatValueUnit(probabilityLabel, question.unit)}
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
