import { range } from "lodash";
import { useTranslations } from "next-intl";
import { FC } from "react";
import React from "react";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryScatter,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";
import { CurveChoiceOption } from "@/types/question";

type Props = {
  histogramData: { x: number; y: number }[];
  choiceOptions: CurveChoiceOption[];
  median: number | undefined;
  color: "blue" | "gray";
  height: number;
};

const CurveHistogram: FC<Props> = ({
  histogramData,
  median,
  color,
  choiceOptions,
  height,
}) => {
  const t = useTranslations();
  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const maxY = Math.max(...histogramData.map((d) => d.y));
  return (
    <>
      <VictoryChart
        theme={chartTheme}
        domain={{
          x: [0, 100],
          y: [0, maxY],
        }}
        containerComponent={
          <VictoryContainer
            responsive={true}
            style={{
              pointerEvents: "auto",
              userSelect: "auto",
              touchAction: "auto",
            }}
          />
        }
        padding={{ top: 0, bottom: 25, left: 10, right: 10 }}
        height={height}
      >
        <VictoryBar
          data={histogramData}
          style={{
            data: {
              fill: "light" + color,
            },
          }}
          barRatio={1.2}
          x={(d) => d.x + 0.5}
        />
        <VictoryAxis
          tickValues={range(0, 101)}
          tickFormat={(x: number) => (x % 10 === 0 ? `${x}%` : "")}
          style={{
            tickLabels: {
              fontSize: 10,
            },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
            grid: { stroke: "none" },
          }}
        />
        {choiceOptions[0].forecast && (
          <VictoryScatter
            data={[{ y: 0, x: choiceOptions[0].forecast * 100 }]}
            dataComponent={<CustomPoint color="#ff7000" />}
          />
        )}
        {median && (
          <VictoryScatter
            data={[{ y: 0, x: median * 100 }]}
            dataComponent={<CustomPoint color="#1f44ff" />}
          />
        )}
      </VictoryChart>

      <div className="mt-4 flex w-full flex-col gap-1">
        {choiceOptions[0] && (
          <div className="flex items-center rounded bg-gray-0 p-2 text-sm dark:bg-gray-0-dark">
            <div className="mr-2 size-4 rounded-sm bg-mc-option-11"></div>
            <p className="m-0">{choiceOptions[0].label}</p>

            <span className={"ml-auto text-gray-800 dark:text-gray-800-dark"}>
              {choiceOptions[0].forecast != null
                ? `${(100 * choiceOptions[0].forecast).toFixed(1)}%`
                : "?"}
            </span>
          </div>
        )}

        <div className="flex items-center rounded bg-gray-0 p-2 text-sm dark:bg-gray-0-dark">
          <div className="mr-2 size-4 rounded-sm bg-mc-option-1"></div>
          <p className="m-0 ">{t("crowdMedian")}</p>

          <span className={"ml-auto text-gray-800 dark:text-gray-800-dark"}>
            {median != null ? `${(100 * median).toFixed(1)}%` : "?"}
          </span>
        </div>

        {choiceOptions[1] && (
          <div className="flex items-center rounded bg-gray-0 p-2 text-sm dark:bg-gray-0-dark">
            <p className="m-0 ">{choiceOptions[1].label}</p>

            <span className={"ml-auto text-gray-800 dark:text-gray-800-dark"}>
              {choiceOptions[1].forecast != null
                ? `${(100 * choiceOptions[1].forecast).toFixed(1)}%`
                : "?"}
            </span>
          </div>
        )}
      </div>
    </>
  );
};

const CustomPoint = ({ color, ...props }: any) => {
  const { x, y } = props;
  return (
    <g transform={`translate(${x}, ${y})`} className="w-4">
      <circle r={3} style={{ fill: color }} />
      <line
        x={0}
        y={0}
        x2={0}
        y2={10}
        style={{
          stroke: color,
          strokeWidth: "2px",
        }}
      />
      <rect
        rx={2}
        width={16}
        height={16}
        x={-8}
        y={8}
        style={{
          fill: color,
        }}
      />
    </g>
  );
};

export default CurveHistogram;
