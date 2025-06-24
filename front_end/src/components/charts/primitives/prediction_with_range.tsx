"use client";
import { isNil } from "lodash";
import { FC } from "react";
import { D3Scale } from "victory";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

type PredictionWithRangeProps = {
  x?: number;
  y?: number;
  symbol?: string;
  scale?: {
    x?: D3Scale;
    y?: D3Scale;
  };
  datum?: { y1: number; y2: number };
};

const PredictionWithRange: FC<PredictionWithRangeProps> = (props) => {
  const { x, y, symbol, datum, scale } = props;
  const { getThemeColor } = useAppTheme();
  if (isNil(scale?.y) || isNil(x) || isNil(y) || isNil(datum)) {
    return null;
  }
  const { y1, y2 } = datum;
  const y1Scaled = scale.y(y1);
  const y2Scaled = scale.y(y2);
  return (
    <>
      {y1 !== undefined && y2 !== undefined && (
        <line
          x1={x}
          x2={x}
          y1={y1Scaled}
          y2={y2Scaled}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}
      {symbol === "circle" && (
        <circle
          cx={x}
          cy={y}
          r={3}
          fill={getThemeColor(METAC_COLORS.gray["0"])}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}

      {symbol === "x" && (
        <polygon
          points={`${x - 3},${y - 3} ${x + 3},${y + 3} ${x},${y} ${x - 3},${y + 3} ${x + 3},${y - 3} ${x},${y}`}
          r={3}
          fill={getThemeColor(METAC_COLORS.gray["0"])}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}
    </>
  );
};

export default PredictionWithRange;
