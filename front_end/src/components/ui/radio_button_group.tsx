import cn from "@/utils/core/cn";

import RadioButton from "./radio_button";

export interface RadioOption<T> {
  value: T;
  label: string;
  description?: string;
}

interface Props<T> {
  options: RadioOption<T>[];
  value: string;
  onChange: (value: T) => void;
  name: string;
  disabled?: boolean;
  className?: string;
}

const RadioButtonGroup = <T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  className,
}: Props<T>) => {
  return (
    <div className={cn("flex flex-col gap-2.5 md:flex-row", className)}>
      {options.map((option) => (
        <div
          key={option.value}
          className={cn(
            "w-full cursor-pointer rounded border border-blue-400 px-4 py-3 transition-colors hover:bg-blue-200 dark:border-blue-400-dark dark:hover:bg-blue-200-dark md:px-5 md:py-5",
            {
              "bg-blue-200 dark:bg-blue-200-dark": value === option.value,
              "cursor-not-allowed": disabled,
            }
          )}
          onClick={() => !disabled && onChange(option.value)}
        >
          <RadioButton
            checked={value === option.value}
            disabled={disabled}
            size="default"
          >
            <div className="ml-2">
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
