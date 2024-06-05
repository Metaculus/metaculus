import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, Input } from "@headlessui/react";
import classNames from "classnames";
import { ChangeEventHandler, FC, FormEvent } from "react";

import Button from "@/components/ui/button";

type Size = "base" | "lg";

type Props = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onErase: () => void;
  onSubmit?: (value: string) => void;
  size?: Size;
  placeholder?: string;
  className?: string;
};

const SearchInput: FC<Props> = ({
  value,
  onChange,
  onErase,
  onSubmit,
  size = "base",
  placeholder,
  className,
}) => {
  return (
    <Field
      as={onSubmit ? "form" : "div"}
      className={classNames(
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
        className="mx-auto block size-full rounded-full border border-blue-500 bg-gray-0 pl-3 pr-16 font-medium placeholder:text-gray-700 dark:border-blue-500 dark:bg-gray-0-dark placeholder:dark:text-gray-700-dark"
        placeholder={placeholder}
      />
      <span className="absolute inset-y-0 right-0 inline-flex h-full justify-center">
        {!!value && (
          <Button
            variant="text"
            onClick={onErase}
            type="button"
            className="-mr-1.5"
            aria-label="Clear"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        )}
        <Button variant="text" type="submit" aria-label="Search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
        </Button>
      </span>
    </Field>
  );
};

export default SearchInput;
