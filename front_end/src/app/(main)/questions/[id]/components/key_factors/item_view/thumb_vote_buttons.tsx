"use client";

import { faThumbsDown, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

export type ThumbVoteSelection = "up" | "down" | null;

type Props = {
  upCount: number;
  downCount: number;

  selected: ThumbVoteSelection;

  disabled?: boolean;
  onClickUp: () => void;
  onClickDown: () => void;

  className?: string;
};

const ThumbVoteButtons: FC<Props> = ({
  upCount,
  downCount,
  selected,
  disabled,
  onClickUp,
  onClickDown,
  className,
}) => {
  const isUp = selected === "up";
  const isDown = selected === "down";

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={isUp}
        onClick={onClickUp}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-xs font-normal transition-colors",
          isUp
            ? "border-blue-600 bg-blue-600 text-gray-0 dark:border-blue-600-dark dark:bg-blue-600-dark dark:text-gray-0-dark"
            : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon
          icon={faThumbsUp}
          className={cn(
            "text-[14px]",
            isUp
              ? "text-gray-0 dark:text-gray-0-dark"
              : "text-blue-600 dark:text-blue-600-dark"
          )}
        />
        {upCount}
      </button>

      <button
        type="button"
        disabled={disabled}
        aria-pressed={isDown}
        onClick={onClickDown}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-xs font-normal transition-colors",
          isDown
            ? "border-blue-600 bg-blue-600 text-gray-0 dark:border-blue-600-dark dark:bg-blue-600-dark dark:text-gray-0-dark"
            : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon
          icon={faThumbsDown}
          className={cn(
            "text-[14px]",
            isDown
              ? "text-gray-0 dark:text-gray-0-dark"
              : "text-blue-600 dark:text-blue-600-dark"
          )}
        />
        {downCount}
      </button>
    </div>
  );
};

export default ThumbVoteButtons;
