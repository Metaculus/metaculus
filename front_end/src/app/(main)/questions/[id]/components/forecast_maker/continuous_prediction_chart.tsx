import { format, fromUnixTime } from "date-fns";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

import ContinuousAreaChart, {
  ContinuousAreaGraphInput,
} from "@/components/charts/continuous_area_chart";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
} from "@/types/charts";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { scaleInternalLocation } from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";
import { abbreviatedNumber } from "@/utils/number_formatters";

type Props = {
  question: QuestionWithNumericForecasts;
  dataset: {
    cdf: number[];
    pmf: number[];
  };
  graphType: ContinuousAreaGraphType;
};

const ContinuousPredictionChart: FC<Props> = ({
  question,
  dataset,
  graphType,
}) => {
  const t = useTranslations();

  const [hoverState, setHoverState] = useState<ContinuousAreaHoverState | null>(
    null
  );

  const cursorDisplayData = useMemo(() => {
    if (!hoverState) return null;

    let xLabel: string;
    const scaledLocation = scaleInternalLocation(
      hoverState.x,
      question.range_min,
      question.range_max,
      question.zero_point
    );
    if (question.type === QuestionType.Date) {
      xLabel = format(fromUnixTime(scaledLocation), "yyyy-MM");
    } else {
      xLabel = abbreviatedNumber(scaledLocation);
    }

    return {
      xLabel,
      yUserLabel:
        graphType === "pmf"
          ? (hoverState.yData.user * 200).toFixed(3)
          : getForecastPctDisplayValue(hoverState.yData.user),
      yCommunityLabel:
        graphType === "pmf"
          ? (hoverState.yData.community * 200).toFixed(3)
          : getForecastPctDisplayValue(hoverState.yData.community),
    };
  }, [
    graphType,
    hoverState,
    question.range_max,
    question.range_min,
    question.type,
    question.zero_point,
  ]);

  const handleCursorChange = useCallback(
    (value: ContinuousAreaHoverState | null) => {
      setHoverState(value);
    },
    []
  );

  const data: ContinuousAreaGraphInput = useMemo(
    () => [
      {
        pmf: question.forecasts.latest_pmf,
        cdf: question.forecasts.latest_cdf,
        type: "community",
      },
      {
        pmf: dataset.pmf,
        cdf: dataset.cdf,
        type: "user",
      },
    ],
    [
      dataset.cdf,
      dataset.pmf,
      question.forecasts.latest_cdf,
      question.forecasts.latest_pmf,
    ]
  );

  return (
    <>
      <ContinuousAreaChart
        height={300}
        rangeMin={question.range_min}
        rangeMax={question.range_max}
        zeroPoint={question.zero_point}
        questionType={question.type}
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
      />
      <div className="my-2 flex justify-center gap-2 text-xs text-gray-600 dark:text-gray-600-dark">
        {cursorDisplayData && (
          <>
            <span>
              {graphType === "pmf" ? "P(x = " : "P(x < "}
              <strong className="text-gray-900 dark:text-gray-900-dark">
                {cursorDisplayData.xLabel}
              </strong>{" "}
              ):
            </span>
            <span>
              <strong className="text-gray-900 dark:text-gray-900-dark">
                {cursorDisplayData.yUserLabel}
              </strong>{" "}
              ({t("you")});
            </span>
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
