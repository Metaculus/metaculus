import { isNil } from "lodash";
import React, { ComponentProps } from "react";
import { Point, Tuple, VictoryLabel } from "victory";

import { Line } from "@/types/charts";
import { getClosestYValue, interpolateYValue } from "@/utils/charts";

const SIZE = 4;

type Props<T> = {
  chartData: Array<{
    type: T;
    line: Line;
    color: string;
  }>;
  chartHeight: number;
  paddingBottom?: number;
  paddingTop?: number;
  yDomain: Tuple<number>;
  smooth: boolean;
};
const LineCursorPoints = <T extends string>({
  chartData,
  yDomain,
  chartHeight,
  paddingBottom = 0,
  paddingTop = 0,
  x,
  datum,
  smooth,
}: ComponentProps<typeof VictoryLabel> & Props<T>) => {
  if (isNil(datum?.x) || isNil(datum?.y) || isNil(x)) {
    return null;
  }

  return (
    <>
      {chartData.map(({ line, color }, index) => {
        const yValue = smooth
          ? interpolateYValue(datum.x, line)
          : getClosestYValue(datum.x, line);

        // adjust the scaledY using the visible graph area
        // the graph is visually stretched from top due to padding, so we need to add the top padding after scaling
        const scaledY =
          (yValue / yDomain[1]) * (chartHeight - paddingBottom - paddingTop);

        // adjust the final position by adding paddingBottom to place it in the correct position
        const finalScaledY = chartHeight - scaledY - paddingBottom;

        return (
          <Point
            key={index}
            // TODO: figure out why victory adds extra 5 pixels to cursor position
            // and remove the magic number
            x={x - 5}
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
