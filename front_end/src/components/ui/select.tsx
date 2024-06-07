import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import classNames from "classnames";
import { Fragment, useMemo } from "react";

import Button, { ButtonVariant } from "@/components/ui/button";

export type SelectOption<T> = {
  value: T;
  label: string;
  className?: string;
};

type Props<T> = {
  value: T;
  onChange: (option: T) => void;
  options: SelectOption<T>[];
  buttonVariant?: ButtonVariant;
  label?: string;
  className?: string;
};

const Select = <T extends string>({
  options,
  onChange,
  value,
  buttonVariant = "text",
  label,
  className,
}: Props<T>) => {
  const activeOptionLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value]
  );

  return (
    <Listbox
      as={"div"}
      value={value}
      onChange={onChange}
      className="relative text-gray-900 dark:text-gray-900-dark"
    >
      <ListboxButton as={Button} variant={buttonVariant} className={className}>
        <FontAwesomeIcon icon={faChevronDown} />
        <span className="align-middle">{label ?? activeOptionLabel}</span>
      </ListboxButton>
      <ListboxOptions className="absolute right-0 top-10 z-50 divide-y divide-gray-300 rounded border border-gray-300 bg-gray-0 shadow-lg outline-none dark:divide-gray-300-dark dark:border-gray-300-dark dark:bg-gray-0-dark">
        {options.map((option) => (
          <ListboxOption as={Fragment} key={option.value} value={option.value}>
            {({ focus, selected }) => (
              <button
                className={classNames(
                  "h-10 w-full whitespace-nowrap px-3 text-right text-sm",
                  {
                    "bg-gray-200 dark:bg-gray-200-dark": focus,
                    "font-bold": selected,
                  },
                  option.className
                )}
              >
                {option.label}
              </button>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
};

export default Select;
