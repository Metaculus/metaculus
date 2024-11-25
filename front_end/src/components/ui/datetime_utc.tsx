import { format, formatISO, parseISO } from "date-fns";
import { isNil } from "lodash";
import React, { ChangeEvent, useEffect, useState } from "react";

import { Input, InputProps } from "@/components/ui/form_field";
import { logError } from "@/utils/errors";

interface DatetimeUtcProps extends Omit<InputProps, "onChange"> {
  defaultValue?: string;
  onChange?: (value: string) => void;
  onError?: (error: any) => void;
}

/**
 * Datetime input component which renders datetime in user's local timezone
 * but stores and accepts values in UTC format
 */
const DatetimeUtc: React.FC<DatetimeUtcProps> = ({
  defaultValue,
  onChange,
  onError,
  ...props
}) => {
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
      logError(e);
      onError && onError(e);
    }
  };

  return (
    <Input
      type="datetime-local"
      defaultValue={localValue}
      onChange={handleChange}
      {...props}
    />
  );
};

export default DatetimeUtc;
