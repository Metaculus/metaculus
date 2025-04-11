import { isNil } from "lodash";
import React, { ComponentProps } from "react";
import { Point, Tuple, VictoryLabel } from "victory";

import { Line } from "@/types/charts";
import {
  getClosestXValue,
  getClosestYValue,
  interpolateYValue,
} from "@/utils/charts";

const SIZE = 4;
// https://commerce.nearform.com/open-source/victory/docs/api/victory-cursor-container#cursorlabeloffset
const DEFAULT_X_OFFSET = 5;

type Props<T> = {
  chartData: Array<{
    type: T;
    line: Line;
    color: string;
    graphType: "pmf" | "cdf";
  }>;
  chartWidth: number;
  chartHeight: number;
  paddingBottom?: number;
  paddingTop?: number;
  paddingLeft?: number;
  paddingRight?: number;
  yDomain: Tuple<number>;
  barWidth: number;
  discrete?: boolean;
};

const LineCursorPoints = <T extends string>({
  chartData,
  yDomain,
  chartWidth,
  chartHeight,
  barWidth,
  paddingBottom = 0,
  paddingTop = 0,
  paddingLeft = 0,
  paddingRight = 0,
  x,
  datum,
  discrete,
}: ComponentProps<typeof VictoryLabel> & Props<T>) => {
  if (isNil(datum?.x) || isNil(datum?.y) || isNil(x)) {
    return null;
  }

  return (
    <>
      {chartData.map(({ line, color }, index) => {
        const yValue = discrete
          ? getClosestYValue(datum.x, line)
          : interpolateYValue(datum.x, line);

        // adjust the scaledY using the visible graph area
        // the graph is visually stretched from top due to padding, so we need to add the top padding after scaling
        const scaledY =
          (yValue / yDomain[1]) * (chartHeight - paddingBottom - paddingTop);
        // adjust the final position by adding paddingBottom to place it in the correct position
        const finalScaledY = chartHeight - scaledY - paddingBottom;

        const availableWidth = chartWidth - paddingLeft - paddingRight;
        const xValue = getClosestXValue(datum.x, line);
        const scaledX = xValue * availableWidth + paddingLeft - barWidth / 2;

        return discrete ? (
          <rect
            key={index}
            x={scaledX}
            y={finalScaledY}
            width={barWidth}
            height={scaledY}
            style={{
              fill: color,
              opacity: 0.3,
            }}
          />
        ) : (
          <Point
            key={index}
            x={x - DEFAULT_X_OFFSET}
            y={finalScaledY}
            size={SIZE}
            style={{
              fill: "transparent",
              stroke: color,
              strokeWidth: 1,
            }}
          />
        );
      })}
    </>
  );
};

export default LineCursorPoints;
