import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, Input } from "@headlessui/react";
import { ChangeEventHandler, FC, FormEvent } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Size = "base" | "lg";

type Props = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onErase: () => void;
  onSubmit?: (value: string) => void;
  size?: Size;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  eraseButtonClassName?: string;
  submitButtonClassName?: string;
  submitIconClassName?: string;
};

const SearchInput: FC<Props> = ({
  value,
  onChange,
  onErase,
  onSubmit,
  size = "base",
  placeholder,
  className,
  inputClassName,
  eraseButtonClassName,
  submitButtonClassName,
  submitIconClassName,
}) => {
  return (
    <Field
      as={onSubmit ? "form" : "div"}
      className={cn(
        "relative flex w-full rounded-full text-sm text-gray-900 dark:text-gray-900-dark",
        { "h-8": size === "base" },
        { "h-12": size === "lg" },
        className
      )}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
    >
      <Input
        name="search"
        type="search"
        value={value}
        onChange={onChange}
        className={cn(
          "mx-auto block size-full rounded-full border border-blue-500 bg-gray-0 pl-3  pr-16 text-base font-medium placeholder:text-gray-700 dark:border-blue-500 dark:bg-gray-0-dark placeholder:dark:text-gray-700-dark sm:text-sm",
          inputClassName
        )}
        placeholder={placeholder}
      />
      <span className="absolute inset-y-0 right-0 inline-flex h-full justify-center text-gray-200">
        {!!value && (
          <Button
            variant="text"
            onClick={onErase}
            type="button"
            className={cn("md:-mr-3", eraseButtonClassName)}
            aria-label="Clear"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        )}
        <Button
          variant="text"
          type="submit"
          aria-label="Search"
          className={cn(submitButtonClassName)}
        >
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={cn(
              "text-blue-800 dark:text-blue-200",
              submitIconClassName
            )}
          />
        </Button>
      </span>
    </Field>
  );
};

export default SearchInput;
