import { Select as HeadlessSelect } from "@headlessui/react";
import { ComponentPropsWithoutRef, forwardRef, Fragment, Ref } from "react";

import { SelectOption } from "@/components/ui/listbox";
import cn from "@/utils/core/cn";

type Props<T> = {
  name?: string;
  options: (SelectOption<T> & {
    disabled?: boolean;
  })[];
  className?: string;
  defaultValue?: T;
} & ComponentPropsWithoutRef<"select">;

const InlineSelect = <T extends string>(
  props: Props<T>,
  ref: Ref<HTMLSelectElement>
) => {
  const { options, className, ...restProps } = props;
  return (
    <div className="relative inline pr-4">
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 10 5"
          className="h-2.5 w-2.5"
        >
          <path
            className="fill-gray-1000 dark:fill-gray-1000-dark"
            d="M5.00008 6.00002L0.75708 1.75702L2.17208 0.343018L5.00008 3.17202L7.82808 0.343018L9.24308 1.75702L5.00008 6.00002Z"
          />
        </svg>
      </div>
      <HeadlessSelect as={Fragment}>
        <select
          className={cn(
            "rounded-none bg-transparent focus:outline-none",
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
            >
              {option.label}
            </option>
          ))}
        </select>
      </HeadlessSelect>
    </div>
  );
};

export default forwardRef(InlineSelect) as <T>(
  props: Props<T> & { ref?: Ref<HTMLSelectElement> }
) => ReturnType<typeof InlineSelect>;
