"use client";

import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import { ImpactDirection } from "@/types/comment";
import cn from "@/utils/core/cn";

type VerticalImpactBarProps = {
  direction: ImpactDirection | null;
  strength: number;
  size?: "default" | "narrow";
};

const SIZE_CONFIG = {
  default: {
    widthClass: "w-3 md:w-5",
    iconSize: "text-[10px] md:text-[14px]",
    radius: 2,
    lineOverhang: 2,
  },
  narrow: {
    widthClass: "w-3",
    iconSize: "text-[10px]",
    radius: 2,
    lineOverhang: 2,
  },
} as const;

const DIRECTION_COLORS: Record<ImpactDirection, string> = {
  increase: "bg-olive-600 dark:bg-olive-600-dark",
  decrease: "bg-salmon-500 dark:bg-salmon-500-dark",
  uncertainty: "bg-blue-600 dark:bg-blue-600-dark",
};

const ARROW_TEXT_COLORS: Record<ImpactDirection, string> = {
  increase: "text-olive-600 dark:text-olive-600-dark",
  decrease: "text-salmon-500 dark:text-salmon-500-dark",
  uncertainty: "text-blue-600 dark:text-blue-600-dark",
};

const HalfBar: FC<{
  position: "top" | "bottom";
  direction: ImpactDirection;
  fillPercent: number;
  active: boolean;
  radius: number;
}> = ({ position, direction, fillPercent, active, radius }) => {
  const fillColor = DIRECTION_COLORS[direction];
  const borderColor = active
    ? DIRECTION_COLORS[direction]
    : "bg-blue-500 dark:bg-blue-500-dark";
  const emptyPercent = 100 - fillPercent;
  const isTop = position === "top";

  const outerRadius = isTop
    ? `${radius}px ${radius}px 0 0`
    : `0 0 ${radius}px ${radius}px`;
  const innerRadius = Math.max(0, radius - 1);
  const innerBorderRadius = isTop
    ? `${innerRadius}px ${innerRadius}px 0 0`
    : `0 0 ${innerRadius}px ${innerRadius}px`;

  return (
    <div
      className={cn("relative flex-1 overflow-hidden", borderColor)}
      style={{ borderRadius: outerRadius }}
    >
      <div
        className="absolute bg-blue-200 dark:bg-blue-200-dark"
        style={{
          inset: 1,
          borderRadius: innerBorderRadius,
        }}
      />

      {fillPercent > 0 && (
        <div
          className={cn("absolute transition-[inset] duration-300", fillColor)}
          style={{
            inset: isTop
              ? `${emptyPercent}% 1px 1px 1px`
              : `1px 1px ${emptyPercent}% 1px`,
            borderRadius: innerBorderRadius,
          }}
        />
      )}
    </div>
  );
};

const EmptyHalf: FC<{ position: "top" | "bottom"; radius: number }> = ({
  position,
  radius,
}) => {
  const isTop = position === "top";
  const outerRadius = isTop
    ? `${radius}px ${radius}px 0 0`
    : `0 0 ${radius}px ${radius}px`;
  const innerRadius = Math.max(0, radius - 1);
  const innerBorderRadius = isTop
    ? `${innerRadius}px ${innerRadius}px 0 0`
    : `0 0 ${innerRadius}px ${innerRadius}px`;

  return (
    <div
      className="relative flex-1 bg-blue-500 dark:bg-blue-500-dark"
      style={{ borderRadius: outerRadius }}
    >
      <div
        className="absolute bg-blue-200 dark:bg-blue-200-dark"
        style={{ inset: 1, borderRadius: innerBorderRadius }}
      />
    </div>
  );
};

/**
 * Computes the clip-path for the white (on-fill) arrow.
 * The fill region in full-bar coordinates:
 *  - increase: top half fills from bottom up → clip from (50 - fill*0.45)% to 50%
 *  - decrease: bottom half fills from top down → clip from 50% to (50 + fill*0.45)%
 *  - uncertainty: both halves fill → clip both regions
 */
function getFillClipPath(
  direction: ImpactDirection,
  fillPercent: number
): string | undefined {
  if (fillPercent <= 0) return "inset(100% 0 0 0)"; // hide entirely

  const halfFill = fillPercent * 0.52;

  if (direction === "increase") {
    // fill is in top half, from (50 - halfFill)% to 50%
    return `inset(${50 - halfFill}% 0 50% 0)`;
  }
  if (direction === "decrease") {
    // fill is in bottom half, from 50% to (50 + halfFill)%
    return `inset(50% 0 ${50 - halfFill}% 0)`;
  }
  // uncertainty: both halves filled
  return `inset(${50 - halfFill}% 0 ${50 - halfFill}% 0)`;
}

const VerticalImpactBar: FC<VerticalImpactBarProps> = ({
  direction,
  strength,
  size = "default",
}) => {
  const { widthClass, iconSize, radius, lineOverhang } = SIZE_CONFIG[size];
  const fillPercent = (Math.max(0, Math.min(5, strength)) / 5) * 90;

  if (!direction) {
    return (
      <div className={cn("flex shrink-0 flex-col gap-0.5", widthClass)}>
        <EmptyHalf position="top" radius={radius} />
        <EmptyHalf position="bottom" radius={radius} />
      </div>
    );
  }

  const topActive = direction === "increase" || direction === "uncertainty";
  const bottomActive = direction === "decrease" || direction === "uncertainty";

  const lineColor = DIRECTION_COLORS[direction];
  const fillClip = getFillClipPath(direction, fillPercent);

  return (
    <div className={cn("relative shrink-0 self-stretch", widthClass)}>
      <div className="flex h-full flex-col gap-0.5">
        <HalfBar
          position="top"
          direction={direction}
          fillPercent={topActive ? fillPercent : 0}
          active={topActive}
          radius={radius}
        />
        <HalfBar
          position="bottom"
          direction={direction}
          fillPercent={bottomActive ? fillPercent : 0}
          active={bottomActive}
          radius={radius}
        />
      </div>

      <div
        className={cn("absolute top-1/2 h-px -translate-y-1/2", lineColor)}
        style={{ left: -lineOverhang, right: -lineOverhang }}
      />

      {/* Colored arrow — visible on unfilled background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {topActive && (
          <div
            className={cn(
              "absolute bottom-1/2 left-1/2 -translate-x-1/2",
              iconSize,
              ARROW_TEXT_COLORS[direction]
            )}
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </div>
        )}
        {bottomActive && (
          <div
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2",
              iconSize,
              ARROW_TEXT_COLORS[direction]
            )}
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </div>
        )}
      </div>

      {/* White arrow — clip-path'd to fill region only */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ clipPath: fillClip }}
      >
        {topActive && (
          <div
            className={cn(
              "absolute bottom-1/2 left-1/2 -translate-x-1/2 text-gray-0 dark:text-gray-0-dark",
              iconSize
            )}
          >
            <FontAwesomeIcon icon={faArrowUp} />
          </div>
        )}
        {bottomActive && (
          <div
            className={cn(
              "absolute left-1/2 top-1/2 -translate-x-1/2 text-gray-0 dark:text-gray-0-dark",
              iconSize
            )}
          >
            <FontAwesomeIcon icon={faArrowDown} />
          </div>
        )}
      </div>
    </div>
  );
};

export default VerticalImpactBar;
