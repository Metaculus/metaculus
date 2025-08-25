"use client";

import { isNil } from "lodash";
import { ComponentProps, FC } from "react";
import { Point } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

type Props = ComponentProps<typeof Point> & {
  pointColor?: string;
  pointSize?: number;
  scale?: {
    x: (x: number) => number;
    y: (y: number) => number;
  };
  chartWidth: number;
  chartRightPadding: number;
};

const GroupResolutionPoint: FC<Props> = ({
  x,
  y,
  datum,
  pointColor,
  pointSize = 10,
  scale,
  chartWidth,
  chartRightPadding,
}) => {
  const TEXT_PADDING = 2;
  const { getThemeColor } = useAppTheme();
  const color =
    pointColor ?? datum?.pointColor ?? getThemeColor(METAC_COLORS.olive["800"]);

  const { x1, y1, text } = datum;
  if (isNil(x) || isNil(y) || isNil(scale)) {
    return null;
  }
  let textOffset = 0;
  if (datum?.y === 0.5) {
    textOffset = 0;
  } else if (datum?.y > 0.5) {
    textOffset = -pointSize;
  } else {
    textOffset = pointSize;
  }

  const shouldAdjustBorderText = x === chartWidth - chartRightPadding;
  const textAdjustmentY = datum?.y > 0.5 ? pointSize / 4 : -pointSize / 4;
  return (
    <g>
      {x1 && y1 && Math.abs(y1 - datum?.y) > 0.1 && (
        <line
          x1={scale.x(x1)}
          y1={scale.y(y1)}
          x2={x}
          y2={y - (text ? textOffset : 0)}
          stroke={color}
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={1}
        />
      )}

      {text ? (
        <>
          <rect
            x={
              x -
              pointSize * (text === "Yes" ? 1.4 : 0.9) -
              TEXT_PADDING -
              (shouldAdjustBorderText ? pointSize / 2 : 0)
            }
            y={y - (pointSize * 1.5) / 2 + textAdjustmentY}
            width={pointSize * (text === "Yes" ? 2.5 : 2) + TEXT_PADDING}
            height={pointSize * 1.5}
            fill={getThemeColor(METAC_COLORS.gray["200"])}
            stroke={color}
            strokeWidth={1}
            rx={2}
            ry={2}
          />
          <text
            x={
              x -
              pointSize * (text === "Yes" ? 1.4 : 0.9) -
              (shouldAdjustBorderText ? pointSize / 2 : 0)
            }
            y={y + pointSize / 2 + textAdjustmentY}
            fill={color}
            fontSize={pointSize * 1.3}
            fontWeight={500}
          >
            {text}
          </text>
        </>
      ) : (
        <rect
          transform={`rotate(45, ${x}, ${y})`}
          width={pointSize}
          height={pointSize}
          x={x - pointSize / 2}
          y={y - pointSize / 2}
          fill={getThemeColor(METAC_COLORS.gray["200"])}
          stroke={color}
          strokeWidth={2}
        />
      )}
    </g>
  );
};

export default GroupResolutionPoint;
