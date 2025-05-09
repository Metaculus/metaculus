import { Input } from "@headlessui/react";
import { ChangeEvent, FC } from "react";

import cn from "@/utils/core/cn";

const INPUT_REGEX = /^(\d{1,2}\.?\d?)?%?$/;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onForecastChange: (value: number) => void;
  minValue: number;
  maxValue: number;
  isDirty?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
};

const ForecastTextInput: FC<Props> = ({
  value,
  onForecastChange,
  minValue,
  maxValue,
  isDirty,
  onChange,
  className,
  onFocus,
  onBlur,
  disabled = false,
}) => {
  const handleBlur = () => {
    if (!Number.isNaN(parseFloat(value)) && !value.endsWith("%")) {
      onChange(value + "%");
    }
    onBlur?.();
  };

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const parsed = parseFloat(value);
    if (
      (Number.isNaN(parsed) && value.length !== 0) ||
      !INPUT_REGEX.test(value) ||
      (parsed !== 0 && (parsed < minValue || parsed > maxValue))
    ) {
      return;
    }

    onChange(value);
    if (Number.isNaN(parsed) || parsed === 0) return;
    onForecastChange(parsed);
  }

  return (
    <Input
      className={cn(
        "h-6 w-12 border text-center text-sm font-medium leading-5",
        isDirty
          ? "border-orange-800 bg-orange-100 text-orange-800 dark:border-orange-800-dark dark:bg-orange-100-dark dark:text-orange-800-dark"
          : "border-gray-700 bg-gray-0 text-orange-700 dark:border-gray-700-dark dark:bg-gray-0-dark dark:text-orange-700-dark",
        className
      )}
      type="text"
      inputMode="decimal"
      value={value}
      onBlur={handleBlur}
      onClick={(event) => event.stopPropagation()}
      onChange={handleChange}
      onFocus={(event) => {
        event.target.select();
        onFocus?.();
      }}
      disabled={disabled}
    />
  );
};

export default ForecastTextInput;
