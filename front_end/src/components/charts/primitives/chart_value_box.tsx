import { isNil } from "lodash";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { Resolution } from "@/types/post";
import { QuestionType } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { resolveToCssColor } from "@/utils/resolve_color";

const TEXT_PADDING = 6;
const PLACEMENT_OFFSET_VERTICAL = 4;
const PLACEMENT_OFFSET_HORIZONTAL = -12;
const CHIP_HEIGHT = 16;
const CHIP_FONT_SIZE = 12;

type Placement = "in" | "below" | "above" | "left" | "right";

function getTextAnchor(placement: Placement) {
  switch (placement) {
    case "left":
      return "start";
    case "right":
      return "end";
    default:
      return "middle";
  }
}

function getRectX(
  placement: Placement,
  adjustedX: number,
  textWidth: number,
  textAlignToSide?: boolean
) {
  switch (placement) {
    case "left":
      return (
        adjustedX -
        (textAlignToSide
          ? PLACEMENT_OFFSET_HORIZONTAL
          : PLACEMENT_OFFSET_VERTICAL) +
        textWidth -
        TEXT_PADDING / 2
      );
    case "right":
      return (
        adjustedX +
        (textAlignToSide
          ? PLACEMENT_OFFSET_HORIZONTAL
          : PLACEMENT_OFFSET_VERTICAL) -
        textWidth +
        TEXT_PADDING / 2
      );
    default:
      return adjustedX - textWidth / 2;
  }
}

function getTextX(
  placement: Placement,
  adjustedX: number,
  textAlignToSide?: boolean
) {
  switch (placement) {
    case "left":
      return (
        adjustedX -
        (textAlignToSide
          ? PLACEMENT_OFFSET_HORIZONTAL
          : PLACEMENT_OFFSET_VERTICAL)
      );
    case "right":
      return (
        adjustedX +
        (textAlignToSide
          ? PLACEMENT_OFFSET_HORIZONTAL
          : PLACEMENT_OFFSET_VERTICAL)
      );
    default:
      return adjustedX;
  }
}

function getResolvedX(
  placement: Placement,
  adjustedX: number,
  textAlignToSide?: boolean
) {
  switch (placement) {
    case "left":
      return (
        adjustedX -
        (textAlignToSide
          ? PLACEMENT_OFFSET_HORIZONTAL
          : PLACEMENT_OFFSET_VERTICAL) -
        TEXT_PADDING / 2
      );
    case "right":
      return (
        adjustedX +
        (textAlignToSide
          ? PLACEMENT_OFFSET_HORIZONTAL
          : PLACEMENT_OFFSET_VERTICAL) +
        TEXT_PADDING / 2
      );
    default:
      return adjustedX;
  }
}

function getTextY(
  placement: Placement,
  y: number,
  isDistributionChip?: boolean,
  textAlignToSide?: boolean
) {
  const baseY =
    y + CHIP_FONT_SIZE / 10 - (isDistributionChip ? CHIP_HEIGHT : 0);
  switch (placement) {
    case "left":
    case "right":
      return baseY + (textAlignToSide ? CHIP_HEIGHT : -2);
    default:
      return baseY;
  }
}

function getResolvedY(
  placement: Placement,
  y: number,
  isDistributionChip?: boolean,
  textAlignToSide?: boolean
) {
  const baseY = y - CHIP_HEIGHT - 1 - (isDistributionChip ? CHIP_HEIGHT : 0);
  switch (placement) {
    case "left":
    case "right":
      return baseY + (textAlignToSide ? CHIP_HEIGHT + 2 : 0);
    default:
      return baseY;
  }
}

function getRectY(
  placement: Placement,
  y: number,
  isDistributionChip?: boolean,
  textAlignToSide?: boolean
) {
  const baseY = y - CHIP_HEIGHT / 2 - (isDistributionChip ? CHIP_HEIGHT : 0);
  switch (placement) {
    case "left":
    case "right":
      return baseY + (textAlignToSide ? CHIP_HEIGHT : -2);
    default:
      return baseY;
  }
}

const ChartValueBox: FC<{
  x?: number | null;
  y?: number | null;
  datum?: {
    y: number;
    placement?: Placement;
  };
  isCursorActive: boolean;
  chartWidth: number;
  rightPadding: number;
  colorOverride?: ThemeColor | string;
  getCursorValue?: (value: number) => string;
  resolution?: Resolution | null;
  isDistributionChip?: boolean;
  questionType?: QuestionType;
  textAlignToSide?: boolean;
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
    textAlignToSide,
  } = props;
  const CHIP_OFFSET = !isNil(resolution) ? 8 : 0;

  const displayText = useMemo(() => {
    if (!!resolution && !isCursorActive) return String(resolution);
    const v = datum?.y;
    if (typeof v !== "number") return "";
    return getCursorValue ? getCursorValue(v) : v.toFixed(1);
  }, [resolution, isCursorActive, datum?.y, getCursorValue]);

  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef<SVGTextElement>(null);
  const placement = datum?.placement ?? "in";
  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.getBBox().width + TEXT_PADDING);
    }
  }, [displayText]);

  if (isNil(x) || isNil(y)) return null;

  const adjustedX =
    isCursorActive || isDistributionChip
      ? x
      : chartWidth - rightPadding + textWidth / 2 + CHIP_OFFSET;
  const hasResolution = !!resolution && !isCursorActive;

  const chipFill =
    resolveToCssColor(getThemeColor, colorOverride) ??
    getThemeColor(METAC_COLORS.olive["600"]);

  return (
    <g>
      {hasResolution && questionType !== QuestionType.Binary && (
        <text
          x={getResolvedX(placement, adjustedX, textAlignToSide)}
          y={getResolvedY(placement, y, isDistributionChip, textAlignToSide)}
          textAnchor={getTextAnchor(placement)}
          dominantBaseline="middle"
          fill={getThemeColor(METAC_COLORS.purple["800"])}
          fontWeight="650"
          letterSpacing="0.02em"
          fontSize={11}
          style={{ textTransform: "uppercase" }}
        >
          RESOLVED
        </text>
      )}

      {/* Original chip background - unchanged */}
      <rect
        x={getRectX(placement, adjustedX, textWidth, textAlignToSide)}
        y={getRectY(placement, y, isDistributionChip, textAlignToSide)}
        width={textWidth}
        height={CHIP_HEIGHT}
        fill={chipFill}
        stroke="transparent"
        rx={2}
        ry={2}
      />

      {/* Original value text - unchanged */}
      <text
        ref={textRef}
        x={getTextX(placement, adjustedX, textAlignToSide)}
        y={getTextY(placement, y, isDistributionChip, textAlignToSide)}
        textAnchor={getTextAnchor(placement)}
        dominantBaseline="middle"
        fill={getThemeColor(METAC_COLORS.gray["0"])}
        fontWeight="650"
        letterSpacing="0.02em"
        fontSize={CHIP_FONT_SIZE}
      >
        {displayText}
      </text>
    </g>
  );
};

export default ChartValueBox;
