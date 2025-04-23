import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Fragment, useMemo } from "react";

import Button, { ButtonVariant } from "@/components/ui/button";
import cn from "@/utils/core/cn";

export type SelectOption<T> = {
  value: T;
  label: string;
  className?: string;
};

type Props<T> = {
  value: T;
  onChange: (option: T) => void;
  onClick?: (value: string) => void;
  options: SelectOption<T>[];
  buttonVariant?: ButtonVariant;
  arrowPosition?: "left" | "right";
  label?: string;
  className?: string;
};

const Listbox = <T extends string>({
  options,
  onChange,
  onClick,
  value,
  buttonVariant = "text",
  arrowPosition = "left",
  label,
  className,
}: Props<T>) => {
  const activeOptionLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value]
  );

  return (
    <HeadlessListbox
      as={"div"}
      value={value}
      onChange={onChange}
      className="relative text-gray-900 dark:text-gray-900-dark"
    >
      <ListboxButton
        as={Button}
        variant={buttonVariant}
        className={cn(className, {
          "flex-row-reverse": arrowPosition === "right",
        })}
      >
        <FontAwesomeIcon icon={faChevronDown} />
        <span className="align-middle">{label ?? activeOptionLabel}</span>
      </ListboxButton>
      <ListboxOptions className="absolute right-0 top-10 z-50 divide-y divide-gray-300 rounded border border-gray-300 bg-gray-0 shadow-lg outline-none dark:divide-gray-300-dark dark:border-gray-300-dark dark:bg-gray-0-dark">
        {options.map((option) => (
          <ListboxOption as={Fragment} key={option.value} value={option.value}>
            {({ focus, selected }) => (
              <button
                className={cn(
                  "h-10 w-full whitespace-nowrap px-3 text-right text-sm",
                  {
                    "bg-gray-200 dark:bg-gray-200-dark": focus,
                    "font-bold": selected,
                  },
                  option.className
                )}
                onClick={() => onClick && onClick(option.label)}
              >
                {option.label}
              </button>
            )}
          </ListboxOption>
        ))}
      </ListboxOptions>
    </HeadlessListbox>
  );
};

export default Listbox;
