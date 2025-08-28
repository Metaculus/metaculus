"use client";

import { isNil } from "lodash";
import { ComponentProps, FC } from "react";
import { Point } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

type Props = ComponentProps<typeof Point> & {
  activePoint: string | null;
  pointColor?: string;
  resolvedPointColor?: string;
  bgColor?: string;
  pointSize?: number;
};

const FanPoint: FC<Props> = ({
  x,
  y,
  datum,
  activePoint,
  pointColor,
  resolvedPointColor,
  bgColor,
  pointSize = 10,
}) => {
  const { getThemeColor } = useAppTheme();

  const resolvedColor =
    resolvedPointColor ?? getThemeColor(METAC_COLORS.purple["800"]);
  const color = pointColor ?? getThemeColor(METAC_COLORS.olive["800"]);
  const backgroundColor = bgColor ?? getThemeColor(METAC_COLORS.gray["0"]);

  const resolved = datum?.resolved;
  const active = datum?.x === activePoint;

  const innerSize = pointSize - 2;

  if (isNil(x) || isNil(y)) {
    return null;
  }

  if (resolved) {
    return (
      <g transform={`rotate(45, ${x}, ${y})`}>
        <rect
          width={pointSize}
          height={pointSize}
          x={x - pointSize / 2}
          y={y - pointSize / 2}
          fill={backgroundColor}
          stroke={resolvedColor}
          strokeWidth={6}
          strokeOpacity={active ? 0.3 : 0}
        />
        <rect
          width={innerSize}
          height={innerSize}
          x={x - innerSize / 2}
          y={y - innerSize / 2}
          fill={backgroundColor}
          stroke={resolvedColor}
          strokeWidth={2}
        />
      </g>
    );
  }

  return (
    <rect
      width={pointSize}
      height={pointSize}
      x={x - pointSize / 2}
      y={y - pointSize / 2}
      fill={color}
      stroke={color}
      strokeWidth={6}
      strokeOpacity={active ? 0.3 : 0}
    />
  );
};

export default FanPoint;
