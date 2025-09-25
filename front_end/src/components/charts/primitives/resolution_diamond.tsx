"use client";
import React, { forwardRef, memo } from "react";

import { ThemeColor } from "@/types/theme";
import cn from "@/utils/core/cn";

export type DiamondDatum = {
  placement: "in" | "below" | "above";
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
  rotateDeg?: number;
};

const ResolutionDiamond = forwardRef<SVGGElement, Props>(function RD(
  {
    x,
    y,
    datum,
    axisPadPx = 2,
    hoverable = true,
    isHovered = false,
    refProps,
    rotateDeg = 0,
  },
  ref
) {
  const d = (datum as DiamondDatum | undefined) ?? { placement: "in" };
  const { placement } = d;

  if (x == null || y == null) return null;

  const anchorY =
    placement === "above"
      ? y - axisPadPx
      : placement === "below"
        ? y + axisPadPx
        : y;

  const baseTransform = `translate(${x}, ${anchorY}) rotate(${rotateDeg})`;

  const bob = placement === "in" ? 5.5 : 4.0;
  const values =
    placement === "below"
      ? `0,0;0,${bob};0,0`
      : placement === "above"
        ? `0,0;0,${-bob};0,0`
        : `0,${-bob};0,${bob};0,${-bob}`;
  const keyTimes = placement === "in" ? "0;0.5;1" : "0;0.825;1";
  const keySplines =
    placement === "in"
      ? "0.25 0.1 0.25 1; 0.25 0.1 0.25 1"
      : "0.25 0.1 0.25 1; 0.5 0 1 1";

  const HIT_W = 36;
  const HIT_H = 44;
  const HIT_X = -HIT_W / 2;
  const HIT_Y = -HIT_H / 2;

  return (
    <g
      ref={ref}
      transform={baseTransform}
      className={cn(hoverable && "res-diamond--hover")}
      style={{
        cursor: hoverable ? "pointer" : "default",
        pointerEvents: "all",
      }}
      aria-label="Resolution marker"
      {...refProps}
    >
      <g>
        {!isHovered && (
          <animateTransform
            attributeName="transform"
            type="translate"
            dur="1.8s"
            repeatCount="indefinite"
            values={values}
            keyTimes={keyTimes}
            calcMode="spline"
            keySplines={keySplines}
          />
        )}

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
            className="fill-gray-0 stroke-purple-800 dark:fill-gray-0-dark dark:stroke-purple-800-dark"
          />
          <path
            d="M6.53516 18.7148L1.28516 13.4648C1.01172 13.2188 1.01172 12.8086 1.28516 12.5352C1.53125 12.2891 1.94141 12.2891 2.21484 12.5352L7 17.3477L11.7852 12.5625C12.0312 12.2891 12.4414 12.2891 12.7148 12.5625C12.9609 12.8086 12.9609 13.2188 12.7148 13.4648L7.4375 18.7148C7.19141 18.9883 6.78125 18.9883 6.53516 18.7148Z"
            className="fill-purple-500 dark:fill-purple-500-dark"
          />
          <path
            d="M6.53516 23.7148L1.28516 18.4648C1.01172 18.2188 1.01172 17.8086 1.28516 17.5352C1.53125 17.2891 1.94141 17.2891 2.21484 17.5352L7 22.3477L11.7852 17.5625C12.0312 17.2891 12.4414 17.2891 12.7148 17.5625C12.9609 17.8086 12.9609 18.2188 12.7148 18.4648L7.4375 23.7148C7.19141 23.9883 6.78125 23.9883 6.53516 23.7148Z"
            className="fill-purple-500 dark:fill-purple-500-dark"
          />
        </g>
      </g>
    </g>
  );
});

export default memo(ResolutionDiamond);
