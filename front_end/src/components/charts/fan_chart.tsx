"use client";
import { isNil, merge } from "lodash";
import React, { FC, useMemo, useState } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
  VictoryVoronoiContainer,
} from "victory";

import ChartFanTooltip from "@/components/charts/primitives/chart_fan_tooltip";
import FanPoint from "@/components/charts/primitives/fan_point";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { Area, FanOption, Line } from "@/types/charts";
import { Quartiles } from "@/types/question";

const TOOLTIP_WIDTH = 150;

type Props = {
  options: FanOption[];
  height?: number;
  yLabel?: string;
  withTooltip?: boolean;
  extraTheme?: VictoryThemeDefinition;
};

const FanChart: FC<Props> = ({
  options,
  height = 150,
  yLabel,
  withTooltip = false,
  extraTheme,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const [activePoint, setActivePoint] = useState<string | null>(null);

  const { line, area, points } = useMemo(
    () => buildChartData(options),
    [options]
  );

  const tooltipItems = useMemo(
    () =>
      options.reduce<Record<string, Quartiles>>(
        (acc, el) => ({ ...acc, [el.name]: el.quartiles }),
        {}
      ),
    [options]
  );

  const shouldDisplayChart = !!chartWidth;
  return (
    <div ref={chartContainerRef} className="w-full" style={{ height }}>
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          domain={{
            y: [0, 1],
          }}
          domainPadding={{
            x: TOOLTIP_WIDTH / 2,
          }}
          containerComponent={
            withTooltip ? (
              <VictoryVoronoiContainer
                voronoiBlacklist={["fanArea", "fanLine"]}
                labels={({ datum }) => datum.x}
                labelComponent={
                  <ChartFanTooltip
                    chartHeight={height}
                    items={tooltipItems}
                    width={TOOLTIP_WIDTH}
                  />
                }
                onActivated={(points) => {
                  const x = points[0]?.x;
                  if (!isNil(x)) {
                    setActivePoint(x);
                  }
                }}
              />
            ) : undefined
          }
          events={[
            {
              target: "parent",
              eventHandlers: {
                onMouseOutCapture: () => {
                  setActivePoint(null);
                },
              },
            },
          ]}
        >
          <VictoryArea
            name="fanArea"
            data={area}
            style={{
              data: {
                fill: getThemeColor(METAC_COLORS.olive["500"]),
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine
            name="fanLine"
            data={line}
            style={{
              data: {
                stroke: getThemeColor(METAC_COLORS.olive["700"]),
              },
            }}
          />
          <VictoryScatter
            data={points.map((point) => ({
              ...point,
              symbol: point.resolved ? "diamond" : "square",
            }))}
            style={{
              data: {
                fill: ({ datum }) =>
                  datum.resolved
                    ? "none"
                    : getThemeColor(METAC_COLORS.olive["800"]),
                stroke: ({ datum }) =>
                  datum.resolved
                    ? getThemeColor(METAC_COLORS.purple["800"])
                    : getThemeColor(METAC_COLORS.olive["800"]),
                strokeWidth: ({ datum }) => (datum.resolved ? 2 : 6),
                strokeOpacity: ({ datum }) =>
                  datum.resolved ? 1 : activePoint === datum.x ? 0.3 : 0,
              },
            }}
            dataComponent={<FanPoint activePoint={activePoint} />}
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
