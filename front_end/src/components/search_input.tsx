"use client";
import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, Input } from "@headlessui/react";
import classNames from "classnames";
import {
  ChangeEventHandler,
  FC,
  FormEvent,
  RefObject,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import Button from "@/components/ui/button";

type Size = "base" | "lg";

type Props = {
  onChange: ChangeEventHandler<HTMLInputElement>;
  onErase: () => void;
  onSubmit?: (value: string) => void;
  size?: Size;
  placeholder?: string;
  className?: string;
  globalSearch?: boolean;
  inputRef?: RefObject<HTMLInputElement>;
};

const SearchInput: FC<Props> = ({
  onChange,
  onErase,
  onSubmit,
  size = "base",
  placeholder,
  className,
  globalSearch,
  inputRef,
}) => {
  const [value, setValue] = useState("");
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlSearchQuery = searchParams.get("search");
    if (urlSearchQuery) {
      setValue(urlSearchQuery);
    } else {
      // Clear the search input if there's no search param in the URL
      setValue("");
    }
  }, [searchParams]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setValue(e.target.value);
    onChange(e);
  };

  const handleErase = () => {
    setValue("");
    onErase();
  };

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
        onChange={handleChange}
        className={classNames(
          "mx-auto block size-full rounded-full border border-blue-500  pl-3 pr-16 font-medium placeholder:text-gray-700 dark:border-blue-500 dark:bg-gray-0-dark placeholder:dark:text-gray-700-dark",
          globalSearch
            ? " border border-blue-700 bg-black/5 text-white placeholder:text-white/50 dark:border-blue-700 dark:bg-blue-800 dark:placeholder:text-white/50"
            : "bg-gray-0"
        )}
        placeholder={placeholder}
        ref={inputRef}
      />
      <span className="absolute inset-y-0 right-0 inline-flex h-full justify-center">
        {!!value && (
          <Button
            variant="text"
            onClick={handleErase}
            type="button"
            className={classNames(
              "md:-mr-3",
              globalSearch
                ? "text-gray-400 hover:text-gray-0 dark:text-blue-200 dark:hover:text-gray-0"
                : "text-gray-200"
            )}
            aria-label="Clear"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        )}
        <Button
          variant="text"
          type="submit"
          aria-label="Search"
          className={classNames(globalSearch ? " hidden md:block" : "")}
        >
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={classNames(
              globalSearch
                ? " text-blue-600"
                : "text-blue-800 dark:text-blue-200"
            )}
          />
        </Button>
      </span>
    </Field>
  );
};

export default SearchInput;
