import { faChevronDown, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Fragment, useMemo } from "react";

import Button, { ButtonVariant } from "@/components/ui/button";
import cn from "@/utils/cn";

export type SelectOption<T> = {
  value: T;
  label: string;
  className?: string;
};

type SingleSelectProps<T> = {
  multiple?: false;
  value: T;
  onChange: (option: T) => void;
};

type MultiSelectProps<T> = {
  multiple: true;
  value: T[];
  onChange: (options: T[]) => void;
};

type Props<T> = {
  options: SelectOption<T>[];
  onClick?: (value: string) => void;
  buttonVariant?: ButtonVariant;
  arrowPosition?: "left" | "right";
  menuPosition?: "left" | "right";
  label?: string;
  className?: string;
  disabled?: boolean;
} & (SingleSelectProps<T> | MultiSelectProps<T>);

const Listbox = <T extends string>(props: Props<T>) => {
  const {
    options,
    onClick,
    buttonVariant = "text",
    arrowPosition = "left",
    menuPosition = "right",
    label,
    className,
    disabled,
  } = props;

  const activeOptionLabel = useMemo(
    () =>
      props.multiple
        ? "Select options"
        : options.find((o) => o.value === props.value)?.label ?? "",
    [options, props.multiple, props.value]
  );

  // Handle selection change
  const handleChange = (value: T | T[]) => {
    if (props.multiple) {
      props.onChange(value as T[]);
    } else {
      props.onChange(value as T);
    }
  };

  return (
    <HeadlessListbox
      as={"div"}
      value={props.value}
      onChange={handleChange}
      multiple={props.multiple}
      className="relative text-gray-900 dark:text-gray-900-dark"
      disabled={disabled}
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
      <ListboxOptions
        className={cn(
          "absolute top-10 z-50 divide-y divide-gray-300 rounded border border-gray-300 bg-gray-0 shadow-lg outline-none dark:divide-gray-300-dark dark:border-gray-300-dark dark:bg-gray-0-dark",
          {
            "right-0": menuPosition === "right",
            "left-0": menuPosition === "left",
          }
        )}
      >
        {options.map((option) => (
          <ListboxOption as={Fragment} key={option.value} value={option.value}>
            {({ focus, selected }) => (
              <button
                className={cn(
                  "flex h-10 w-full items-center justify-end gap-1 whitespace-nowrap px-3 text-right text-sm",
                  {
                    "bg-gray-200 dark:bg-gray-200-dark": focus,
                    "font-bold": selected,
                  },
                  option.className
                )}
                onClick={() => onClick && onClick(option.label)}
              >
                {!!props.multiple && selected && (
                  <FontAwesomeIcon
                    icon={faCheck}
                    className="text-blue-600 group-hover:text-white group-focus:text-white"
                  />
                )}
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
