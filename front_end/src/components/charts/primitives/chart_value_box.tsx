"use client";
import { isNil } from "lodash";
import { FC, useEffect, useRef, useState } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { Resolution } from "@/types/post";
import { QuestionType } from "@/types/question";
import { ThemeColor } from "@/types/theme";

const ChartValueBox: FC<{
  x?: number | null;
  y?: number | null;
  datum?: { y: number };
  isCursorActive: boolean;
  chartWidth: number;
  rightPadding: number;
  colorOverride?: ThemeColor;
  getCursorValue?: (value: number) => string;
  resolution?: Resolution | null;
  isDistributionChip?: boolean;
  questionType?: QuestionType;
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
    questionType,
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
  const hasResolution = !!resolution && !isCursorActive;

  return (
    <g>
      {/* "RESOLVED" label above the chip for resolution values */}
      {hasResolution && questionType !== QuestionType.Binary && (
        <text
          x={adjustedX}
          y={y - chipHeight - 1 - (isDistributionChip ? chipHeight : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={getThemeColor(METAC_COLORS.purple["800"])}
          fontWeight="600"
          fontSize={11}
          style={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
        >
          RESOLVED
        </text>
      )}

      {/* Original chip background - unchanged */}
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

      {/* Original value text - unchanged */}
      <text
        ref={textRef}
        x={adjustedX}
        y={y + chipFontSize / 10 - (isDistributionChip ? chipHeight : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={getThemeColor(METAC_COLORS.gray["0"])}
        fontWeight="bold"
        fontSize={chipFontSize}
      >
        {!!resolution && !isCursorActive
          ? resolution
          : getCursorValue
            ? getCursorValue(datum?.y as number)
            : datum?.y.toFixed(1)}
      </text>
    </g>
  );
};

export default ChartValueBox;
