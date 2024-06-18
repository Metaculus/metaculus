"use client";
import React, { FC, useMemo } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryTooltip,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { Area, FanOption, Line } from "@/types/charts";

type Props = {
  options: FanOption[];
  height?: number;
  yLabel?: string;
};

const FanChart: FC<Props> = ({ options, height = 150, yLabel }) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const { line, area, points } = useMemo(
    () => buildChartData(options),
    [options]
  );

  const shouldDisplayChart = !!chartWidth;
  return (
    <div ref={chartContainerRef} className="w-full" style={{ height }}>
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={chartTheme}
          domain={{
            y: [0, 1],
          }}
          domainPadding={{
            x: 40,
          }}
        >
          <VictoryScatter
            data={points.map((point) => ({
              ...point,
              symbol: point.resolved ? "diamond" : "square",
            }))}
            style={{
              data: {
                fill: ({ datum }) =>
                  datum.resolved ? "none" : METAC_COLORS.olive["800"].DEFAULT,
                stroke: ({ datum }) =>
                  datum.resolved ? METAC_COLORS.purple["800"].DEFAULT : "none",
                strokeWidth: ({ datum }) => (datum.resolved ? 2 : 0),
              },
            }}
            labelComponent={<VictoryTooltip />}
          />
          <VictoryArea
            data={area}
            style={{
              data: {
                fill: METAC_COLORS.olive["500"].DEFAULT,
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine
            data={line}
            style={{
              data: {
                stroke: METAC_COLORS.olive["700"].DEFAULT,
              },
            }}
          />
          <VictoryAxis dependentAxis label={yLabel} />
          <VictoryAxis />
        </VictoryChart>
      )}
    </div>
  );
};

function buildChartData(options: FanOption[]) {
  const line: Line<string> = [];
  const area: Area<string> = [];
  const points: Array<{ x: string; y: number; resolved: boolean }> = [];

  for (const option of options) {
    line.push({
      x: option.name,
      y: option.quartiles.median,
    });
    area.push({
      x: option.name,
      y0: option.quartiles.lower25,
      y: option.quartiles.upper75,
    });
    points.push({
      x: option.name,
      y: option.quartiles.median,
      resolved: option.resolved,
    });
  }

  return {
    line,
    area,
    points,
  };
}

export default FanChart;
