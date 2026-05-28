"use client";

import { FC, ReactNode, RefObject } from "react";

import cn from "@/utils/core/cn";

import PanelContainer from "./panel_container";

type Props<T extends string> = {
  ref?: RefObject<HTMLDivElement | null>;
  options: T[];
  selectedOption: T | null;
  title: string;
  direction?: "row" | "column";
  isCompact?: boolean;
  inline?: boolean;
  anchorRef: RefObject<HTMLDivElement | null>;
  onSelect: (option: T) => void;
  onClose: () => void;
  renderLabel: (option: T) => ReactNode;
  footer?: ReactNode;
  buttonClassName?: string;
};

function VotePanelInner<T extends string>({
  ref,
  options,
  selectedOption,
  title,
  direction = "row",
  isCompact,
  inline,
  anchorRef,
  onSelect,
  onClose,
  renderLabel,
  footer,
  buttonClassName,
}: Props<T>) {
  return (
    <PanelContainer
      ref={ref}
      anchorRef={anchorRef}
      isCompact={isCompact}
      inline={inline}
      onClose={onClose}
    >
      <span
        className={cn(
          "font-medium leading-3 text-gray-500 dark:text-gray-500-dark",
          isCompact ? "text-[8px]" : "text-[10px]"
        )}
      >
        {title}
      </span>

      <div
        className={cn(
          "flex w-full",
          direction === "column" ? "flex-col" : "flex-col sm:flex-row",
          isCompact ? "gap-1.5" : "gap-2"
        )}
      >
        {options.map((option) => {
          const isSelected = selectedOption === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={cn(
                "rounded border text-xs font-medium leading-4 transition-colors",
                direction === "row" && "sm:flex-1",
                isCompact ? "px-1.5 py-0.5" : "px-2 py-1",
                buttonClassName,
                isSelected
                  ? "border-blue-600 bg-blue-600 text-gray-0 dark:border-blue-600-dark dark:bg-blue-600-dark dark:text-gray-0-dark"
                  : "border-blue-400 bg-gray-0 text-blue-800 hover:bg-blue-100 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:bg-blue-100-dark"
              )}
            >
              {renderLabel(option)}
            </button>
          );
        })}
      </div>

      {footer}
    </PanelContainer>
  );
}

const VotePanel = VotePanelInner as <T extends string>(
  props: Props<T>
) => ReturnType<FC>;

export default VotePanel;
