"use client";
import { format, formatISO, parseISO } from "date-fns";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { ChangeEvent, forwardRef, useEffect, useState } from "react";

import { Input, InputProps } from "@/components/ui/form_field";
import { logError } from "@/utils/errors";

interface DatetimeUtcProps extends Omit<InputProps, "onChange"> {
  defaultValue?: string;
  onChange?: (value: string) => void;
  onError?: (error: any) => void;
  withFormValidation?: boolean;
  className?: string;
  withTimezoneMessage?: boolean;
}

/**
 * Datetime input component which renders datetime in user's local timezone
 * but stores and accepts values in UTC format
 */
const DatetimeUtc = forwardRef<HTMLInputElement, DatetimeUtcProps>(
  (
    {
      defaultValue,
      onChange,
      onError,
      withFormValidation,
      className,
      withTimezoneMessage = true,
      ...props
    },
    ref
  ) => {
    const t = useTranslations();

    const [localValue, setLocalValue] = useState<string>("");

    useEffect(() => {
      if (!isNil(defaultValue)) {
        // Convert stored UTC value to local time for rendering
        const localDate = parseISO(defaultValue);
        if (isNaN(localDate.getTime())) return;

        const localDateString = format(localDate, "yyyy-MM-dd'T'HH:mm");
        setLocalValue(localDateString);
      }
    }, [defaultValue]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const localDateString = event.target.value;
      setLocalValue(localDateString);

      try {
        // Convert local time to UTC for storage
        if (onChange) {
          const localDate = new Date(localDateString);
          const utcDateString = formatISO(localDate, {
            representation: "complete",
          });

          onChange(utcDateString);
        }
      } catch (e) {
        if (withFormValidation) {
          onChange?.("");
          return;
        }

        logError(e);
        onError && onError(e);
      }
    };

    const inputElement = (
      <Input
        ref={ref}
        type="datetime-local"
        defaultValue={
          localValue ? format(localValue, "yyyy-MM-dd'T'HH:mm") : ""
        }
        className={className}
        onChange={handleChange}
        onBlur={handleChange}
        {...props}
      />
    );

    return withTimezoneMessage ? (
      <div className="flex flex-col gap-1">
        {inputElement}
        <span className="text-center text-xs font-normal normal-case italic">
          {t("dateInputDetails", { timezone: getTimezoneOffsetLabel() })}
        </span>
      </div>
    ) : (
      inputElement
    );
  }
);
DatetimeUtc.displayName = "DatetimeUtc";

const getTimezoneOffsetLabel = (): string => {
  const timezoneOffset = new Date().getTimezoneOffset() / -60;
  return `UTC${timezoneOffset >= 0 ? "+" : ""}${timezoneOffset}`;
};

export default DatetimeUtc;
