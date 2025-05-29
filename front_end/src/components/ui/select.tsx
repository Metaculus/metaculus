import { Select as HeadlessSelect } from "@headlessui/react";
import { ComponentPropsWithoutRef, forwardRef } from "react";

import { SelectOption } from "@/components/ui/listbox";
import cn from "@/utils/core/cn";

type Props<T> = {
  name?: string;
  options: (SelectOption<T> & {
    disabled?: boolean;
    className?: string;
  })[];
  className?: string;
  defaultValue?: T;
} & ComponentPropsWithoutRef<"select">;

const Select = <T extends string>(
  props: Props<T>,
  ref: React.Ref<HTMLSelectElement>
) => {
  const { options, className, ...restProps } = props;
  return (
    <HeadlessSelect
      className={cn(
        "min-w-16 rounded-none border border-gray-600 bg-transparent py-1 text-gray-900 dark:border-gray-600-dark dark:bg-gray-0-dark dark:text-gray-900-dark",
        className
      )}
      ref={ref}
      {...restProps}
    >
      {options.map((option) => (
        <option
          value={option.value as unknown as string}
          key={option.value as unknown as string}
          disabled={option.disabled}
          className={cn(
            "text-gray-900 dark:text-gray-900-dark",
            option.className
          )}
        >
          {option.label}
        </option>
      ))}
    </HeadlessSelect>
  );
};

export default forwardRef(Select) as <T>(
  props: Props<T> & { ref?: React.Ref<HTMLSelectElement> }
) => ReturnType<typeof Select>;
