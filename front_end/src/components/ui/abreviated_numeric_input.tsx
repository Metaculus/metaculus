"use client";

import { isNil } from "lodash";
import { FC, useCallback, useEffect, useState } from "react";

import { Input } from "@/components/ui/form_field";
import cn from "@/utils/core/cn";
import { abbreviatedNumber } from "@/utils/formatters/number";

type Props = {
  disabled?: boolean;
  onChange: (value: number | undefined) => void;
  value: number | string | undefined;
  placeholder?: string;
  className?: string;
  error?: string;
  isDirty?: boolean;
  showPercentSign?: boolean;
};

const AbreviatedNumericInput: FC<Props> = ({
  disabled,
  onChange,
  value,
  placeholder,
  className,
  error,
  isDirty,
  showPercentSign,
}) => {
  const [localValue, setLocalValue] = useState<string>(
    isNil(value) ? "" : abbreviatedNumber(value, 4)
  );
  const [isFocused, setIsFocused] = useState(false);
  useEffect(() => {
    if (isFocused) {
      return;
    }
    setLocalValue(isNil(value) ? "" : abbreviatedNumber(value, 4));
  }, [value, isFocused]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const formattedValue = parseFormattedNumber(localValue);
      if (!isNil(formattedValue)) {
        setLocalValue(abbreviatedNumber(formattedValue, 4));
      }

      e.target.placeholder = placeholder ?? "—";
    },
    [localValue, placeholder]
  );
  return (
    <div className="relative">
      <Input
        disabled={disabled}
        onChange={(e) => {
          const inputValue = e.target.value;
          setLocalValue(inputValue);

          const parsedValue = parseFormattedNumber(inputValue);
          onChange(parsedValue);
        }}
        value={
          !isNil(localValue)
            ? showPercentSign && disabled
              ? `${localValue}%`
              : localValue
            : ""
        }
        type={"text"}
        placeholder="—"
        className={cn(
          "h-10 w-full rounded border-2 border-transparent text-center text-xs text-orange-800 [appearance:textfield] placeholder:text-orange-800 focus:border-blue-700 focus:outline-none dark:bg-gray-0-dark dark:text-orange-800-dark dark:placeholder:text-orange-800-dark dark:focus:border-blue-700-dark sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          {
            "hover:border-blue-600": !disabled,
            "border-orange-700 bg-orange-100 dark:border-orange-700-dark dark:bg-orange-100-dark":
              isDirty && !disabled,
            "border-salmon-500 bg-salmon-200 dark:border-salmon-500-dark dark:bg-salmon-200-dark":
              error,
            "text-xs sm:text-base": disabled,
          },
          className
        )}
        onFocus={(e) => {
          setIsFocused(true);
          e.target.placeholder = "";
        }}
        onBlur={(e) => {
          setIsFocused(false);
          handleBlur(e);
        }}
      />
      {showPercentSign && !disabled && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-orange-800 dark:text-orange-800-dark sm:text-sm">
          %
        </span>
      )}
    </div>
  );
};

const parseFormattedNumber = (value: string): number | undefined => {
  // Remove any commas and whitespace
  value = value.replace(/,|\s/g, "").toLowerCase();

  // First, try to parse scientific notation (e.g., 1e5, 2.5e-3, 1.23e+10)
  // This regex matches: optional sign, digits with optional decimal, 'e', optional sign, digits
  const scientificMatch = value.match(/^(-?\d*\.?\d+)e([+-]?\d+)$/);
  if (scientificMatch) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  // Then try abbreviated notation (k, m, b, t)
  const multipliers: { [key: string]: number } = {
    k: 1e3,
    m: 1e6,
    b: 1e9,
    t: 1e12,
  };

  const match = value.match(/^(-?\d*\.?\d+)([kmbt])?$/);
  if (!match || !match[1]) return undefined;

  const number = parseFloat(match[1]);
  const multiplier = match[2] ? multipliers[match[2]] ?? 1 : 1;

  return number * multiplier;
};

export default AbreviatedNumericInput;
