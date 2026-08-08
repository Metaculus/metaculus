"use client";

import { faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Field, Input } from "@headlessui/react";
import React, {
  ChangeEventHandler,
  FC,
  FormEvent,
  useCallback,
  useRef,
  useState,
} from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Size = "base" | "lg";
type IconPosition = "right" | "left";

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
  iconPosition?: IconPosition;
  rightControlsClassName?: string;
  rightButtonClassName?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  collapsible?: boolean;
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
  iconPosition = "right",
  rightControlsClassName,
  rightButtonClassName,
  inputRef,
  collapsible,
}) => {
  const isForm = !!onSubmit;
  const isLeft = iconPosition === "left";

  const [isExpanded, setIsExpanded] = useState(!collapsible || !!value);
  const internalRef = useRef<HTMLInputElement>(null);

  const expand = useCallback(() => {
    setIsExpanded(true);
    requestAnimationFrame(() => {
      if (typeof inputRef === "object" && inputRef?.current) {
        inputRef.current.focus();
      } else {
        internalRef.current?.focus();
      }
    });
  }, [inputRef]);

  const collapse = useCallback(() => {
    if (collapsible && !value) {
      setIsExpanded(false);
    }
  }, [collapsible, value]);

  const handleErase = useCallback(() => {
    onErase();
    if (collapsible) {
      setIsExpanded(false);
    }
  }, [onErase, collapsible]);

  if (collapsible && !isExpanded) {
    return (
      <button
        type="button"
        aria-label={placeholder}
        onClick={expand}
        className={cn(
          "flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-blue-500 bg-gray-0 dark:border-blue-500 dark:bg-gray-0-dark",
          { "h-8 w-8": size === "base" },
          { "h-12 w-12": size === "lg" },
          className
        )}
      >
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className={cn(
            "text-sm text-blue-800 dark:text-blue-200",
            submitIconClassName
          )}
        />
      </button>
    );
  }

  return (
    <Field
      as={isForm ? "form" : "div"}
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
      onBlur={(e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          collapse();
        }
      }}
    >
      {isLeft && (
        <span className="pointer-events-none absolute inset-y-0 left-0 inline-flex items-center pl-3">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className={cn(
              "text-blue-800 dark:text-blue-200",
              submitIconClassName
            )}
          />
        </span>
      )}

      <Input
        ref={inputRef ?? internalRef}
        name="search"
        type="search"
        value={value}
        onChange={onChange}
        className={cn(
          "mx-auto block size-full rounded-full border border-blue-500 bg-gray-0 text-base font-medium placeholder:text-gray-700 dark:border-blue-500 dark:bg-gray-0-dark placeholder:dark:text-gray-700-dark sm:text-sm",
          !isLeft && "pl-3 pr-16",
          isLeft && "pl-10 pr-12",
          inputClassName
        )}
        placeholder={placeholder}
      />

      <span
        className={cn(
          !isLeft &&
            "absolute inset-y-0 right-0 inline-flex h-full justify-center text-gray-200",
          isLeft &&
            "absolute inset-y-0 right-0 inline-flex h-full items-center pr-2 text-gray-200",
          isLeft && rightControlsClassName
        )}
      >
        {!!value && (
          <Button
            variant="text"
            onClick={handleErase}
            type="button"
            className={cn(
              !isLeft && "md:-mr-3",
              isLeft && "h-8 w-8 rounded-full",
              isLeft && rightButtonClassName,
              eraseButtonClassName
            )}
            aria-label="Clear"
          >
            <FontAwesomeIcon icon={faXmark} />
          </Button>
        )}

        {!isLeft && (
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
        )}
      </span>
    </Field>
  );
};

export default SearchInput;
