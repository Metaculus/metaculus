import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";
import { VictoryThemeDefinition } from "victory";

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
import { isForecastActive } from "@/utils/forecasts/helpers";
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
  chartTheme?: VictoryThemeDefinition;
};

const ContinuousPredictionChart: FC<Props> = ({
  question,
  overlayPreviousForecast,
  dataset,
  graphType,
  readOnly = false,
  height = 300,
  width = undefined,
  showCP = true,
  chartTheme,
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

  const defaultAggMethod = question.default_aggregation_method;

  const latestAggLatest = useMemo(
    () => question.aggregations[defaultAggMethod]?.latest ?? null,
    [question.aggregations, defaultAggMethod]
  );

  const myLatest = useMemo(
    () => question.my_forecasts?.latest ?? null,
    [question.my_forecasts]
  );

  const data: ContinuousAreaGraphInput = useMemo(() => {
    const charts: ContinuousAreaGraphInput = [];

    if (showCP && latestAggLatest && isForecastActive(latestAggLatest)) {
      charts.push({
        pmf: cdfToPmf(latestAggLatest.forecast_values),
        cdf: latestAggLatest.forecast_values,
        type:
          question.status === QuestionStatus.CLOSED
            ? "community_closed"
            : "community",
      });
    }

    if (overlayPreviousForecast && myLatest) {
      charts.push({
        pmf: cdfToPmf(myLatest.forecast_values),
        cdf: myLatest.forecast_values,
        type: "user_previous",
      });
    }

    if (!readOnly || !!myLatest) {
      charts.push({
        pmf: dataset.pmf,
        cdf: dataset.cdf,
        componentCdfs: dataset.componentCdfs,
        type: "user",
      });
    }

    return charts;
  }, [
    showCP,
    latestAggLatest,
    question.status,
    overlayPreviousForecast,
    myLatest,
    readOnly,
    dataset,
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
        extraTheme={chartTheme}
        alignChartTabs={true}
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
