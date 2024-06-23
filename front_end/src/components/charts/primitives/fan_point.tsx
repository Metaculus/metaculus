"use client";
import { isNil } from "lodash";
import { ComponentProps, FC } from "react";
import { Point } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

const SIZE = 10;

type Props = ComponentProps<typeof Point> & {
  activePoint: string | null;
};

const FanPoint: FC<Props> = ({ x, y, datum, activePoint }) => {
  const { getThemeColor } = useAppTheme();

  const resolvedColor = getThemeColor(METAC_COLORS.purple["800"]);
  const color = getThemeColor(METAC_COLORS.olive["800"]);
  const backgroundColor = getThemeColor(METAC_COLORS.gray["0"]);

  const resolved = datum?.resolved;
  const active = datum?.x === activePoint;

  const innerSize = SIZE - 2;

  if (isNil(x) || isNil(y)) {
    return null;
  }

  if (resolved) {
    return (
      <g transform={`rotate(45, ${x}, ${y})`}>
        <rect
          width={SIZE}
          height={SIZE}
          x={x - SIZE / 2}
          y={y - SIZE / 2}
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
      width={10}
      height={10}
      x={x - 5}
      y={y - 5}
      fill={color}
      stroke={color}
      strokeWidth={6}
      strokeOpacity={active ? 0.3 : 0}
    />
  );
};

export default FanPoint;
