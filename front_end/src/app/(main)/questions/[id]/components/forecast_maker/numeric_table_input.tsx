import { formatISO, fromUnixTime, getUnixTime } from "date-fns";
import { isNil } from "lodash";
import { FC } from "react";

import DatetimeUtc from "@/components/ui/datetime_utc";
import { Input } from "@/components/ui/form_field";
import { DistributionQuantileValue } from "@/types/question";
import cn from "@/utils/cn";

type Props = {
  type: "number" | "date";
  onQuantileChange: (quantileValue: DistributionQuantileValue) => void;
  quantileValue?: DistributionQuantileValue;
  error?: string;
};

const NumericTableInput: FC<Props> = ({
  type,
  onQuantileChange,
  quantileValue,
  error,
}) => {
  if (type === "number") {
    return (
      <Input
        onChange={(e) => {
          const inputValue = e.target.value;
          onQuantileChange(
            inputValue === ""
              ? { value: undefined, isDirty: true }
              : { value: Number(inputValue), isDirty: true }
          );
        }}
        value={!isNil(quantileValue?.value) ? quantileValue.value : ""}
        type="number"
        placeholder="—"
        className={cn(
          "h-10 w-full rounded border-2 border-transparent text-center text-xs text-orange-800 [appearance:textfield] placeholder:text-orange-800 hover:border-blue-600 focus:border-blue-700 focus:outline-none dark:bg-gray-0-dark dark:text-orange-800-dark dark:placeholder:text-orange-800-dark dark:focus:border-blue-700-dark sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          quantileValue?.isDirty &&
            "border-orange-700 bg-orange-100 dark:border-orange-700-dark dark:bg-orange-100-dark",
          error &&
            "border-salmon-500 bg-salmon-200 dark:border-salmon-500-dark dark:bg-salmon-200-dark"
        )}
        onFocus={(e) => (e.target.placeholder = "")}
        onBlur={(e) => (e.target.placeholder = "—")}
      />
    );
  }

  const dateValue = quantileValue?.value
    ? formatISO(fromUnixTime(Number(quantileValue.value)))
    : undefined;

  return (
    <DatetimeUtc
      defaultValue={dateValue}
      onChange={(isoString) => {
        if (isoString === "") {
          onQuantileChange({
            value: undefined,
            isDirty: true,
          });
        } else {
          const timestamp = getUnixTime(new Date(isoString));
          onQuantileChange({
            value: timestamp,
            isDirty: true,
          });
        }
      }}
      withFormValidation={true}
      withTimezoneMessage={false}
      className={cn(
        "h-10 w-full rounded border-2 border-transparent text-center text-xs text-orange-800 [appearance:textfield] placeholder:text-orange-800 hover:border-blue-600 focus:border-blue-700 focus:outline-none dark:bg-gray-0-dark dark:text-orange-800-dark dark:placeholder:text-orange-800-dark dark:focus:border-blue-700-dark sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        quantileValue?.isDirty &&
          "border-orange-700 bg-orange-100 dark:border-orange-700-dark dark:bg-orange-100-dark",
        error &&
          "border-salmon-500 bg-salmon-200 dark:border-salmon-500-dark dark:bg-salmon-200-dark"
      )}
    />
  );
};

export default NumericTableInput;
