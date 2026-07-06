"use client";

import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type Props = {
  label: ReactNode;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
};

const ServicesQuizToggleChip: FC<Props> = ({
  label,
  isSelected,
  onToggle,
  disabled,
  className,
}) => {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded-lg text-left outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400-dark",
        "min-h-[72px] px-4 py-4 text-base font-bold leading-5",
        isSelected
          ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
          : "bg-gray-0 text-blue-800 hover:bg-blue-500/10 dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:bg-blue-500-dark/10",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span className="pr-2 sm:pr-4">{label}</span>
      <FontAwesomeIcon
        className={cn(
          "text-[20px]",
          isSelected
            ? "text-gray-0 dark:text-gray-0-dark"
            : "text-blue-500 dark:text-blue-500-dark"
        )}
        icon={isSelected ? faMinus : faPlus}
      />
    </button>
  );
};

export default ServicesQuizToggleChip;
