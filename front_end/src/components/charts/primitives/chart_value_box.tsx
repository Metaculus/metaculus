"use client";
import { isNil } from "lodash";
import { FC, useEffect, useRef, useState } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { Resolution } from "@/types/post";
import { ThemeColor } from "@/types/theme";

const ChartValueBox: FC<{
  x?: number | null;
  y?: number | null;
  datum?: any;
  isCursorActive: boolean;
  chartWidth: number;
  rightPadding: number;
  colorOverride?: ThemeColor;
  getCursorValue?: (value: number) => string;
  resolution?: Resolution | null;
  isDistributionChip?: boolean;
}> = (props) => {
  const { getThemeColor } = useAppTheme();
  const {
    x,
    y,
    datum,
    isCursorActive,
    chartWidth,
    rightPadding,
    colorOverride,
    getCursorValue,
    resolution,
    isDistributionChip,
  } = props;
  const TEXT_PADDING = 4;
  const CHIP_OFFSET = !isNil(resolution) ? 8 : 0;

  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef<SVGTextElement>(null);
  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.getBBox().width + TEXT_PADDING);
    }
  }, [datum?.y]);

  if (isNil(x) || isNil(y)) {
    return null;
  }

  const adjustedX =
    isCursorActive || isDistributionChip
      ? x
      : chartWidth - rightPadding + textWidth / 2 + CHIP_OFFSET;
  const chipHeight = 16;
  const chipFontSize = 12;

  return (
    <g>
      <rect
        x={adjustedX - textWidth / 2}
        y={y - chipHeight / 2 - (isDistributionChip ? chipHeight : 0)}
        width={textWidth}
        height={chipHeight}
        fill={
          isNil(colorOverride)
            ? getThemeColor(METAC_COLORS.olive["600"])
            : getThemeColor(colorOverride)
        }
        stroke="transparent"
        rx={2}
        ry={2}
      />
      <text
        ref={textRef}
        x={adjustedX}
        y={y + chipFontSize / 10 - (isDistributionChip ? chipHeight : 0)} // fix vertical alignment
        textAnchor="middle"
        dominantBaseline="middle"
        fill={getThemeColor(METAC_COLORS.gray["0"])}
        fontWeight="bold"
        fontSize={chipFontSize}
      >
        {!!resolution && !isCursorActive
          ? resolution
          : getCursorValue
            ? getCursorValue(datum.y)
            : datum.y.toFixed(1)}
      </text>
    </g>
  );
};

export default ChartValueBox;
