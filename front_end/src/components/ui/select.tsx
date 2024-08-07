import { Select as HeadlessSelect } from "@headlessui/react";
import classNames from "classnames";
import { ComponentPropsWithoutRef, forwardRef } from "react";

import { SelectOption } from "@/components/ui/listbox";

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
      className={classNames(
        "min-w-16 rounded-none border border-gray-600-dark bg-transparent py-1",
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
          className={option.className}
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
