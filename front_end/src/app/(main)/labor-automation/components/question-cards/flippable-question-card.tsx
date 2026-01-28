"use client";

import {
  faStar,
  faChartLine,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ComponentProps, ReactNode, useState } from "react";

import cn from "@/utils/core/cn";

import { QuestionCard } from "./question-card";

type FlipSide = "left" | "right";

type ToggleSelectorProps = {
  selected: FlipSide;
  onSelect: (side: FlipSide) => void;
  leftIcon?: IconDefinition;
  rightIcon?: IconDefinition;
  className?: string;
};

function ToggleSelector({
  selected,
  onSelect,
  leftIcon = faStar,
  rightIcon = faChartLine,
  className,
}: ToggleSelectorProps) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full border border-blue-400 bg-gray-0 p-1 dark:border-blue-400-dark dark:bg-gray-0-dark",
        className
      )}
    >
      {/* Animated pill indicator */}
      <div
        className={cn(
          "absolute h-5 w-7 rounded-full bg-blue-700 transition-transform duration-200 ease-out dark:bg-blue-700-dark",
          selected === "right" && "translate-x-full"
        )}
      />

      {/* Left button */}
      <button
        type="button"
        onClick={() => onSelect("left")}
        className={cn(
          "relative z-10 flex h-5 w-7 items-center justify-center text-sm transition-colors duration-200",
          selected === "left"
            ? "text-gray-0 dark:text-gray-0-dark"
            : "text-blue-700 dark:text-blue-700-dark"
        )}
        aria-label="Show first view"
        aria-pressed={selected === "left"}
      >
        <FontAwesomeIcon icon={leftIcon} size="sm" />
      </button>

      {/* Right button */}
      <button
        type="button"
        onClick={() => onSelect("right")}
        className={cn(
          "relative z-10 flex h-5 w-7 items-center justify-center text-sm transition-colors duration-200",
          selected === "right"
            ? "text-gray-0 dark:text-gray-0-dark"
            : "text-blue-700 dark:text-blue-700-dark"
        )}
        aria-label="Show second view"
        aria-pressed={selected === "right"}
      >
        <FontAwesomeIcon icon={rightIcon} size="sm" />
      </button>
    </div>
  );
}

export type FlippableQuestionCardProps = Omit<
  ComponentProps<typeof QuestionCard>,
  "children"
> & {
  /** Content shown when left side is selected */
  leftContent: ReactNode;
  /** Content shown when right side is selected */
  rightContent: ReactNode;
  /** Custom icon for left toggle button */
  leftIcon?: IconDefinition;
  /** Custom icon for right toggle button */
  rightIcon?: IconDefinition;
  /** Initial selected side */
  defaultSide?: FlipSide;
  /** Controlled selected side */
  selectedSide?: FlipSide;
  /** Callback when side changes */
  onSideChange?: (side: FlipSide) => void;
};

export function FlippableQuestionCard({
  leftContent,
  rightContent,
  leftIcon,
  rightIcon,
  defaultSide = "left",
  selectedSide: controlledSide,
  onSideChange,
  ...questionCardProps
}: FlippableQuestionCardProps) {
  const [internalSide, setInternalSide] = useState<FlipSide>(defaultSide);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledSide !== undefined;
  const currentSide = isControlled ? controlledSide : internalSide;

  const handleSideChange = (side: FlipSide) => {
    if (!isControlled) {
      setInternalSide(side);
    }
    onSideChange?.(side);
  };

  return (
    <QuestionCard {...questionCardProps}>
      {/* Toggle selector aligned to the right */}
      <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 [visibility:var(--ss-hidden,visible)]">
        <ToggleSelector
          selected={currentSide}
          onSelect={handleSideChange}
          leftIcon={leftIcon}
          rightIcon={rightIcon}
        />
      </div>

      {/* Flippable content area */}
      <div className="relative">
        <div
          className={cn(
            "transition-opacity duration-200",
            currentSide === "left"
              ? "opacity-100"
              : "pointer-events-none absolute inset-0 opacity-0"
          )}
        >
          {leftContent}
        </div>
        <div
          className={cn(
            "transition-opacity duration-200",
            currentSide === "right"
              ? "opacity-100"
              : "pointer-events-none absolute inset-0 opacity-0"
          )}
        >
          {rightContent}
        </div>
      </div>
    </QuestionCard>
  );
}

export { ToggleSelector };
export type { FlipSide };
