import { formatISO, fromUnixTime, getUnixTime } from "date-fns";
import { FC } from "react";

import AbreviatedNumericInput from "@/components/ui/abreviated_numeric_input";
import DatetimeUtc from "@/components/ui/datetime_utc";
import { QuantileValue } from "@/types/question";
import cn from "@/utils/core/cn";

type Props = {
  type: "number" | "date";
  onQuantileChange: (quantileValue: Partial<QuantileValue>) => void;
  quantileValue?: QuantileValue;
  error?: string;
  disabled?: boolean;
  showPercentSign?: boolean;
};

const ContinuousTableInput: FC<Props> = ({
  type,
  onQuantileChange,
  quantileValue,
  error,
  disabled,
  showPercentSign,
}) => {
  if (type === "number") {
    return (
      <AbreviatedNumericInput
        disabled={disabled}
        onChange={(value) => {
          onQuantileChange({ value, isDirty: true });
        }}
        value={quantileValue?.value}
        showPercentSign={showPercentSign}
        error={error}
        isDirty={quantileValue?.isDirty}
        placeholder={"—"}
      />
    );
  }

  const dateValue = quantileValue?.value
    ? formatISO(fromUnixTime(Number(quantileValue.value)))
    : undefined;

  return (
    <DatetimeUtc
      disabled={disabled}
      defaultValue={dateValue}
      onChange={(isoString) => {
        onQuantileChange({
          value:
            isoString === "" ? undefined : getUnixTime(new Date(isoString)),
          isDirty: true,
        });
      }}
      withFormValidation={true}
      withTimezoneMessage={false}
      type="date"
      className={cn(
        "h-10 w-full rounded border-2 border-transparent text-center text-xs text-orange-800 [appearance:textfield] placeholder:text-orange-800 focus:border-blue-700 focus:outline-none dark:bg-gray-0-dark dark:text-orange-800-dark dark:placeholder:text-orange-800-dark dark:focus:border-blue-700-dark sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        !disabled && "hover:border-blue-600",
        quantileValue?.isDirty &&
          "border-orange-700 bg-orange-100 dark:border-orange-700-dark dark:bg-orange-100-dark",
        error &&
          "border-salmon-500 bg-salmon-200 dark:border-salmon-500-dark dark:bg-salmon-200-dark"
      )}
    />
  );
};

export default ContinuousTableInput;
