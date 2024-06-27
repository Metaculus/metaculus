import { Select as HeadlessSelect } from "@headlessui/react";
import classNames from "classnames";
import { forwardRef } from "react";

import { SelectOption } from "@/components/ui/listbox";

type Props<T> = {
  name?: string;
  options: SelectOption<T>[];
  className?: string;
};

const Select = forwardRef<HTMLSelectElement, Props<string>>(
  ({ options, className, ...props }, ref) => {
    return (
      <HeadlessSelect
        className={classNames(
          "min-w-16 rounded-none border border-gray-600-dark bg-transparent py-1",
          className
        )}
        ref={ref}
        {...props}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value}>
            {option.label}
          </option>
        ))}
      </HeadlessSelect>
    );
  }
);
Select.displayName = "Select";

export default Select;
