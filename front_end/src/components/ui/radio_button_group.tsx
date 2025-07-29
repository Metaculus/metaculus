import { FC } from "react";

import cn from "@/utils/core/cn";

import RadioButton from "./radio_button";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface Props {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
  className?: string;
}

const RadioButtonGroup: FC<Props> = ({
  options,
  value,
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn("flex gap-4", className)}>
      {options.map((option) => (
        <div
          key={option.value}
          className={cn(
            "w-full cursor-pointer rounded border border-blue-400 p-5 transition-colors hover:bg-blue-200 dark:border-blue-400-dark dark:hover:bg-blue-200-dark",
            {
              "bg-blue-200 dark:bg-blue-200-dark": value === option.value,
              "cursor-not-allowed opacity-50": disabled,
            }
          )}
          onClick={() => !disabled && onChange(option.value)}
        >
          <RadioButton
            checked={value === option.value}
            disabled={disabled}
            size="default"
          >
            <div className="ml-2 cursor-pointer">
              <div className="font-medium text-blue-800 dark:text-blue-800-dark">
                {option.label}
              </div>
              {option.description && (
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-600-dark">
                  {option.description}
                </div>
              )}
            </div>
          </RadioButton>
        </div>
      ))}
    </div>
  );
};

export default RadioButtonGroup;
