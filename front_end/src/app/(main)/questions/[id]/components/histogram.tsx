"use client";

import { isNil, range } from "lodash";
import { useTranslations } from "next-intl";
import React from "react";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
} from "victory";

import ExpandableContent from "@/components/ui/expandable_content";
import SectionToggle from "@/components/ui/section_toggle";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";
import { QuestionWithNumericForecasts } from "@/types/question";

const MAX_COLLAPSED_HEIGHT = 256;

type Props = {
  question: QuestionWithNumericForecasts;
};

const HistogramDrawer: React.FC<Props> = ({ question }) => {
  const t = useTranslations();
  const expandLabel = t("showMore");
  const collapseLabel = t("showLess");

  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  if (!question.forecasts.histogram) {
    return null;
  }

  const histogramData = question.forecasts.histogram.map((value, index) => ({
    x: index,
    y: value,
  }));
  const median = question.forecasts.medians.at(-1);
  const mean = question.forecasts.means.at(-1);

  return (
    <SectionToggle title={t("histogram")} defaultOpen>
      <ExpandableContent
        maxCollapsedHeight={MAX_COLLAPSED_HEIGHT}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        className="-mt-4"
      >
        <div className="mb-5 size-full">
          <VictoryChart
            theme={chartTheme}
            domain={{
              x: [0, 100],
              y: [0, Math.max(...histogramData.map((d) => d.y))],
            }}
            containerComponent={<VictoryContainer responsive={true} />}
            padding={{ top: 24, bottom: 15, left: 10, right: 10 }}
            height={100}
          >
            <VictoryAxis
              tickValues={range(0, 101)}
              tickFormat={(x: number) => (x % 10 === 0 ? `${x}%` : "")}
              style={{
                tickLabels: {
                  fontSize: 5,
                },
                axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
                grid: { stroke: "none" },
              }}
            />
            <VictoryBar
              data={histogramData}
              style={{
                data: {
                  fill: "lightgray",
                  stroke: "darkgray",
                  strokeWidth: 1,
                },
              }}
              barRatio={1.1}
              x={(d) => d.x - 0.5} // Align the bars within the tick marks
            />
            {!isNil(median) && (
              <VictoryLabel
                textAnchor="middle"
                style={{ fontSize: 9, fontWeight: "bold" }}
                x={150}
                y={Math.max(...histogramData.map((d) => d.y)) + 5}
                text={`${(100 * median).toFixed(1)}% ${t("medianPredictionLabel")}`}
              />
            )}
            {!isNil(mean) && (
              <VictoryLabel
                textAnchor="middle"
                style={{ fontSize: 9, fontWeight: "bold" }}
                x={300}
                y={Math.max(...histogramData.map((d) => d.y)) + 5}
                text={`${(100 * mean).toFixed(1)}% ${t("meanPredictionLabel")}`}
              />
            )}
          </VictoryChart>
        </div>
      </ExpandableContent>
    </SectionToggle>
  );
};

export default HistogramDrawer;
