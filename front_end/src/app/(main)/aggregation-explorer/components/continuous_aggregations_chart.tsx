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
  AggregationQuestion,
  Aggregations,
  QuestionWithNumericForecasts,
} from "@/types/question";
import {
  displayValue,
  getDisplayValue,
  scaleInternalLocation,
} from "@/utils/charts";
import { getForecastPctDisplayValue } from "@/utils/forecasts";
import { cdfToPmf } from "@/utils/math";
import InlineSelect from "@/components/ui/inline_select";

type Props = {
  questionData: AggregationQuestion;
  activeTab: keyof Aggregations;
};

const ContinuousAggregationChart: FC<Props> = ({ questionData, activeTab }) => {
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
  }, [graphType, hoverState, scaling]);

  const handleCursorChange = useCallback(
    (value: ContinuousAreaHoverState | null) => {
      setHoverState(value);
    },
    []
  );

  const data: ContinuousAreaGraphInput = useMemo(() => {
    const charts: ContinuousAreaGraphInput = [];
    if (activeAggregation) {
      charts.push({
        pmf: cdfToPmf(
          activeAggregation.history[activeAggregation.history.length - 1]
            .forecast_values
        ),
        cdf: activeAggregation.history[activeAggregation.history.length - 1]
          .forecast_values,
        type: "community",
      });
    }

    return charts;
  }, [activeTab]);

  return (
    <div>
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
      <ContinuousAreaChart
        height={150}
        scaling={scaling}
        questionType={qType}
        graphType={graphType}
        data={data}
        onCursorChange={handleCursorChange}
        resolution={null}
      />
    </div>
  );
};

export default ContinuousAggregationChart;
