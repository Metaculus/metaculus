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

type Props = {
  question: QuestionWithNumericForecasts;
  dataset: {
    cdf: number[];
    pmf: number[];
  };
  graphType: ContinuousAreaGraphType;
  readOnly?: boolean;
};

const ContinuousPredictionChart: FC<Props> = ({
  question,
  dataset,
  graphType,
  readOnly = false,
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
    const charts: ContinuousAreaGraphInput = [
      {
        pmf: question.forecasts.latest_pmf,
        cdf: question.forecasts.latest_cdf,
        type: "community",
      },
    ];

    if (!readOnly) {
      charts.push({
        pmf: dataset.pmf,
        cdf: dataset.cdf,
        type: "user",
      });
    }

    return charts;
  }, [
    dataset.cdf,
    dataset.pmf,
    question.forecasts.latest_cdf,
    question.forecasts.latest_pmf,
    readOnly,
  ]);

  return (
    <>
      <ContinuousAreaChart
        height={300}
        rangeMin={question.range_min!}
        rangeMax={question.range_max!}
        zeroPoint={question.zero_point}
        questionType={question.type}
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
      />
      <div className="my-2 flex min-h-4 justify-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
        {cursorDisplayData && (
          <>
            <span>
              {graphType === "pmf" ? "P(x = " : "P(x < "}
              <strong className="text-gray-900 dark:text-gray-900-dark">
                {cursorDisplayData.xLabel}
              </strong>{" "}
              {"):"}
            </span>
            {cursorDisplayData.yUserLabel !== null && (
              <span>
                <strong className="text-gray-900 dark:text-gray-900-dark">
                  {cursorDisplayData.yUserLabel}
                </strong>{" "}
                ({t("you")});
              </span>
            )}
            <span>
              <strong className="text-gray-900 dark:text-gray-900-dark">
                {cursorDisplayData.yCommunityLabel}
              </strong>{" "}
              ({t("community")})
            </span>
          </>
        )}
      </div>
    </>
  );
};

export default ContinuousPredictionChart;
