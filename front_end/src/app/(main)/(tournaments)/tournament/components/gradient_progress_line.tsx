"use client";

import React from "react";

import cn from "@/utils/core/cn";

type Props = {
  pct: number;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  dotClassName?: string;
  edgeInsetPx?: number;
};

const GradientProgressLine: React.FC<Props> = ({
  pct,
  className,
  trackClassName,
  fillClassName,
  dotClassName,
  edgeInsetPx = 5,
}) => {
  const clamped = Math.max(0, Math.min(100, pct));
  const left = `${clamped}%`;
  const thumbLeft = `clamp(${edgeInsetPx}px, ${left}, calc(100% - ${edgeInsetPx}px))`;

  return (
    <div
      className={cn(
        "relative h-1 w-full rounded-full",
        "bg-blue-400 dark:bg-blue-400-dark",
        className,
        trackClassName
      )}
    >
      <div
        className={cn(
          "h-full rounded-full",
          "bg-gradient-to-r from-blue-200 to-blue-700 dark:from-blue-200-dark dark:to-blue-700-dark",
          fillClassName
        )}
        style={{ width: `${clamped}%` }}
      />

      <div
        className={cn(
          "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full",
          "bg-blue-700 dark:bg-blue-700-dark",
          dotClassName
        )}
        style={{ left: thumbLeft }}
      />
    </div>
  );
};

export default GradientProgressLine;
