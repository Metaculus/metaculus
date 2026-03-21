"use client";

import { FC } from "react";

import cn from "@/utils/core/cn";

import type { SubQuestionOption } from "../utils/sub-questions";

type Props = {
  options: SubQuestionOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
};

const SubQuestionSelector: FC<Props> = ({ options, value, onChange }) => {
  if (!options.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected =
          value !== null && String(value) === String(option.value);
        return (
          <button
            key={String(option.value)}
            type="button"
            className={cn(
              "rounded-md border px-3 py-2 text-sm transition-colors",
              isSelected
                ? "border-blue-600 bg-blue-600 font-semibold text-white shadow-sm dark:border-blue-500 dark:bg-blue-500 dark:text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-600 dark:bg-blue-950 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-blue-900"
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default SubQuestionSelector;
