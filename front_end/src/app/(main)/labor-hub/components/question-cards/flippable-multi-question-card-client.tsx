"use client";

import { faChartLine, faTable } from "@fortawesome/free-solid-svg-icons";
import { type ReactNode, useState } from "react";

import cn from "@/utils/core/cn";

import { ToggleSelector, type FlipSide } from "./flippable-question-card";

type FlippableMultiQuestionCardClientProps = {
  leftContent: ReactNode;
  rightContent: ReactNode;
  className?: string;
  defaultSide?: FlipSide;
};

export function FlippableMultiQuestionCardClient({
  leftContent,
  rightContent,
  className,
  defaultSide = "left",
}: FlippableMultiQuestionCardClientProps) {
  const [currentSide, setCurrentSide] = useState<FlipSide>(defaultSide);

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 [visibility:var(--ss-hidden,visible)] print:hidden">
        <ToggleSelector
          selected={currentSide}
          leftIcon={faTable}
          rightIcon={faChartLine}
          onToggle={() =>
            setCurrentSide((side) => (side === "left" ? "right" : "left"))
          }
        />
      </div>

      <div className="relative">
        <div
          className={cn(
            "transition-opacity duration-200",
            currentSide === "left"
              ? "opacity-100"
              : "pointer-events-none invisible absolute inset-0 opacity-0"
          )}
        >
          {leftContent}
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            currentSide === "right"
              ? "opacity-100"
              : "pointer-events-none invisible absolute inset-0 opacity-0"
          )}
        >
          {rightContent}
        </div>
      </div>
    </div>
  );
}
