"use client";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
  ChangeEventHandler,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import SearchInput from "@/components/search_input";
import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

type Props = {
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onErase: () => void;
  placeholder?: string;
  collapsedWidthClassName?: string;
  expandedWidthClassName?: string;
  keepOpenWhenHasValue?: boolean;
  collapseOnBlur?: boolean;
  className?: string;
  buttonClassName?: string;
  inputClassName?: string;
};

const ExpandableSearchInput: FC<Props> = ({
  value,
  onChange,
  onErase,
  placeholder = "search...",
  collapsedWidthClassName = "w-9",
  expandedWidthClassName = "w-[220px]",
  keepOpenWhenHasValue = true,
  collapseOnBlur = true,
  className,
  buttonClassName,
  inputClassName,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isExpanded = open || (keepOpenWhenHasValue && !!value);

  const getInputEl = useCallback(
    () =>
      rootRef.current?.querySelector<HTMLInputElement>('input[type="search"]'),
    []
  );

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => getInputEl()?.focus());
  }, [getInputEl]);

  const blurInput = useCallback(() => {
    requestAnimationFrame(() => getInputEl()?.blur());
  }, [getInputEl]);

  useEffect(() => {
    if (isExpanded) focusInput();
  }, [isExpanded, focusInput]);

  const collapseIfAllowed = () => {
    if (!collapseOnBlur) return;
    if (keepOpenWhenHasValue && value) return;
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-9 transition-[width] duration-200 ease-out",
        isExpanded ? expandedWidthClassName : collapsedWidthClassName,
        className
      )}
      onBlurCapture={(e) => {
        const next = e.relatedTarget as Node | null;
        if (next && rootRef.current?.contains(next)) return;
        collapseIfAllowed();
      }}
      onKeyDownCapture={(e) => {
        if (e.key === "Escape") {
          if (!value) setOpen(false);
          (e.target as HTMLElement)?.blur?.();
        }
      }}
    >
      {!isExpanded ? (
        <Button
          type="button"
          variant="text"
          aria-label="Open search"
          className={cn(
            "h-9 w-9 rounded-full border border-gray-300 bg-gray-0",
            "dark:border-gray-500-dark dark:bg-gray-0-dark",
            buttonClassName
          )}
          onClick={() => {
            setOpen(true);
            focusInput();
          }}
        >
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-gray-700 dark:text-gray-700-dark"
          />
        </Button>
      ) : (
        <SearchInput
          value={value}
          onChange={onChange}
          onErase={() => {
            onErase();
            if (keepOpenWhenHasValue) setOpen(false);
            blurInput();
          }}
          placeholder={placeholder}
          className="h-9 w-full"
          iconPosition="left"
          inputClassName={cn(
            "h-9 border border-gray-300 bg-gray-0 text-sm font-medium",
            "placeholder:text-gray-600 dark:placeholder:text-gray-600-dark",
            "focus:outline-none focus:border-blue-500",
            "dark:border-gray-500-dark dark:bg-gray-0-dark",
            inputClassName
          )}
          submitIconClassName="text-gray-700 dark:text-gray-700-dark"
        />
      )}
    </div>
  );
};

export default ExpandableSearchInput;
