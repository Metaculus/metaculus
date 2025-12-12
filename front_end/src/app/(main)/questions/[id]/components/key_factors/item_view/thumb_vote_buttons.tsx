"use client";

import { faThumbsDown, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

export type ThumbVoteSelection = "up" | "down" | null;

type Props = {
  upCount: number;
  downCount: number;

  upLabel: string;
  downLabel: string;

  selected: ThumbVoteSelection;

  disabled?: boolean;
  onClickUp: () => void;
  onClickDown: () => void;

  className?: string;
};

const ThumbVoteButtons: FC<Props> = ({
  upCount,
  downCount,
  upLabel,
  downLabel,
  selected,
  disabled,
  onClickUp,
  onClickDown,
  className,
}) => {
  const isUp = selected === "up";
  const isDown = selected === "down";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={isUp}
        onClick={onClickUp}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-xs font-normal transition-colors",
          isUp
            ? "border-olive-700 bg-olive-700 text-gray-0 dark:border-olive-700-dark dark:bg-olive-700-dark dark:text-gray-0-dark"
            : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon
          icon={faThumbsUp}
          className={cn(
            "text-[14px]",
            isUp
              ? "text-gray-0 dark:text-gray-0-dark"
              : "text-olive-700 dark:text-olive-700-dark"
          )}
        />
        <span>
          {upCount} {upLabel}
        </span>
      </button>

      <button
        type="button"
        disabled={disabled}
        aria-pressed={isDown}
        onClick={onClickDown}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-xs font-normal transition-colors",
          isDown
            ? "border-salmon-600 bg-salmon-600 text-gray-0 dark:border-salmon-600-dark dark:bg-salmon-600-dark dark:text-gray-0-dark"
            : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon
          icon={faThumbsDown}
          className={cn(
            "text-[14px]",
            isDown
              ? "text-gray-0 dark:text-gray-0-dark"
              : "text-salmon-600 dark:text-salmon-600-dark"
          )}
        />
        <span>
          {downCount} {downLabel}
        </span>
      </button>
    </div>
  );
};

export default ThumbVoteButtons;
