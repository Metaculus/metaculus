"use client";

import { faCircle as faCircleRegular } from "@fortawesome/free-regular-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FC, ReactNode } from "react";

import cn from "@/utils/core/cn";

type Props = {
  title: ReactNode;
  description?: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
  onDeselect?: () => void;
  disabled?: boolean;
  className?: string;
};

const ServicesQuizRadioCard: FC<Props> = ({
  title,
  description,
  isSelected,
  onSelect,
  onDeselect,
  disabled,
  className,
}) => {
  const handleClick = () => {
    if (disabled) return;

    if (isSelected && onDeselect) {
      onDeselect();
      return;
    }

    onSelect();
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg text-left outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400-dark",
        "min-h-[72px] px-4 py-4",
        isSelected
          ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
          : "bg-gray-0 text-blue-800 hover:bg-blue-500/10 dark:bg-gray-0-dark dark:text-blue-800-dark dark:hover:bg-blue-500-dark/10",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div className="min-w-0 pr-4">
        <div className="text-base font-bold leading-5">{title}</div>

        {description ? (
          <div
            className={cn(
              "mt-2 text-sm leading-5",
              isSelected
                ? "text-gray-0/80 dark:text-gray-0-dark/80"
                : "text-blue-700 dark:text-blue-700-dark"
            )}
          >
            {description}
          </div>
        ) : null}
      </div>

      <FontAwesomeIcon
        className={cn(
          "shrink-0 text-[20px]",
          isSelected
            ? "text-gray-0 dark:text-gray-0-dark"
            : "text-blue-500 dark:text-blue-500-dark"
        )}
        icon={isSelected ? faCircleCheck : faCircleRegular}
      />
    </button>
  );
};

export default ServicesQuizRadioCard;
