"use client";
import React, { forwardRef, memo } from "react";

import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import { ThemeColor } from "@/types/theme";
import cn from "@/utils/core/cn";

export type DiamondDatum = {
  placement: "in" | "below" | "above" | "left" | "right";
  primary?: ThemeColor;
  secondary?: ThemeColor;
};

type Props = {
  x?: number;
  y?: number;
  datum?: unknown;
  axisPadPx?: number;
  hoverable?: boolean;
  isHovered?: boolean;
  refProps?: React.SVGProps<SVGGElement>;
};

function getRotationDeg(placement: DiamondDatum["placement"]) {
  switch (placement) {
    case "left":
      return 90;
    case "right":
      return -90;
    case "below":
      return 0;
    case "above":
      return 180;
    default:
      return 0;
  }
}

function getAnchorX(
  placement: DiamondDatum["placement"],
  x: number,
  axisPadPx: number
) {
  switch (placement) {
    case "left":
      return x - axisPadPx;
    case "right":
      return x + axisPadPx;
    default:
      return x;
  }
}

function getAnchorY(
  placement: DiamondDatum["placement"],
  y: number,
  axisPadPx: number
) {
  switch (placement) {
    case "above":
      return y - axisPadPx;
    case "below":
      return y + axisPadPx;
    // case "left":
    //   return y + axisPadPx;
    // case "right":
    //   return y + axisPadPx;
    default:
      return y;
  }
}

const ResolutionDiamond = forwardRef<SVGGElement, Props>(function RD(
  { x, y, datum, axisPadPx = 5, hoverable = true, isHovered = false, refProps },
  ref
) {
  const { getThemeColor } = useAppTheme();
  const d = (datum as DiamondDatum | undefined) ?? { placement: "in" };
  const { placement } = d;
  if (x == null || y == null) return null;

  const rotateDeg = getRotationDeg(placement);
  const anchorY = getAnchorY(placement, y, axisPadPx);
  const anchorX = getAnchorX(placement, x, axisPadPx);

  const baseTransform = `translate(${anchorX}, ${anchorY}) rotate(${rotateDeg})`;

  // Arrow color animation values
  const lightColor = getThemeColor(METAC_COLORS.purple[500]);
  const darkColor = getThemeColor(METAC_COLORS.purple[800]);

  // Animation timing for 750ms duration (250ms each section):
  // Arrow 1: dark from 0% to 33.3% (250ms), then light
  // Arrow 2: light until 33.3%, dark from 33.3% to 66.7% (250ms), then light
  // Both light: 66.7% to 100% (250ms pause)
  const arrow1Values = `${darkColor};${darkColor};${lightColor};${lightColor}`;
  const arrow1KeyTimes = "0;0.333;0.4;1";

  const arrow2Values = `${lightColor};${lightColor};${darkColor};${darkColor};${lightColor};${lightColor}`;
  const arrow2KeyTimes = "0;0.333;0.4;0.667;0.733;1";

  const HIT_W = 36;
  const HIT_H = 44;
  const HIT_X = -HIT_W / 2;
  const HIT_Y = -HIT_H / 2;

  return (
    <g
      ref={ref}
      transform={baseTransform}
      style={{
        cursor: hoverable ? "pointer" : "default",
        pointerEvents: "all",
      }}
      aria-label="Resolution marker"
      {...refProps}
    >
      <g>
        <rect
          x={HIT_X}
          y={HIT_Y}
          width={HIT_W}
          height={HIT_H}
          fill="transparent"
          pointerEvents="all"
        />

        <g transform="translate(-7,-12)">
          <path
            d="M12.2324 7L7 12.2324L1.76758 7L7 1.76758L12.2324 7Z"
            strokeWidth={2.5}
            className={cn(
              "fill-gray-0 dark:fill-gray-0-dark",
              isHovered
                ? "stroke-purple-900 dark:fill-purple-900-dark"
                : "stroke-purple-800 dark:stroke-purple-800-dark"
            )}
          />
          <path
            d="M6.53516 18.7148L1.28516 13.4648C1.01172 13.2188 1.01172 12.8086 1.28516 12.5352C1.53125 12.2891 1.94141 12.2891 2.21484 12.5352L7 17.3477L11.7852 12.5625C12.0312 12.2891 12.4414 12.2891 12.7148 12.5625C12.9609 12.8086 12.9609 13.2188 12.7148 13.4648L7.4375 18.7148C7.19141 18.9883 6.78125 18.9883 6.53516 18.7148Z"
            fill={isHovered ? darkColor : lightColor}
          >
            {!isHovered && (
              <animate
                attributeName="fill"
                values={arrow1Values}
                keyTimes={arrow1KeyTimes}
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </path>
          <path
            d="M6.53516 23.7148L1.28516 18.4648C1.01172 18.2188 1.01172 17.8086 1.28516 17.5352C1.53125 17.2891 1.94141 17.2891 2.21484 17.5352L7 22.3477L11.7852 17.5625C12.0312 17.2891 12.4414 17.2891 12.7148 17.5625C12.9609 17.8086 12.9609 18.2188 12.7148 18.4648L7.4375 23.7148C7.19141 23.9883 6.78125 23.9883 6.53516 23.7148Z"
            fill={isHovered ? darkColor : lightColor}
          >
            {!isHovered && (
              <animate
                attributeName="fill"
                values={arrow2Values}
                keyTimes={arrow2KeyTimes}
                dur="1s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </g>
      </g>
    </g>
  );
});

export default memo(ResolutionDiamond);
