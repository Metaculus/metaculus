"use client";

import React, { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  disabled?: boolean;
  className?: string;
};

const ServicesQuizTextField: FC<Props> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  className,
}) => {
  return (
    <label className={cn("flex flex-col gap-3", className)}>
      <span className="text-base font-medium leading-5 text-blue-800 dark:text-blue-800-dark">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg px-5 py-4 text-base leading-5 outline-none transition-colors",
          "min-h-[56px]",
          "border border-gray-200 bg-gray-0 text-blue-800 placeholder:text-blue-800/40",
          "dark:border-gray-200-dark dark:bg-gray-0-dark dark:text-blue-800-dark dark:placeholder:text-blue-800-dark/40",
          "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400-dark",
          disabled && "cursor-not-allowed opacity-50"
        )}
      />
    </label>
  );
};

export default ServicesQuizTextField;
