"use client";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
  ChangeEventHandler,
  FC,
  useEffect,
  useMemo,
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
  collapseOnErase?: boolean;
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
  collapseOnErase = true,
  className,
  buttonClassName,
  inputClassName,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isExpanded = useMemo(() => {
    if (open) return true;
    if (keepOpenWhenHasValue && value) return true;
    return false;
  }, [open, keepOpenWhenHasValue, value]);

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  const collapseIfAllowed = () => {
    if (!collapseOnBlur) return;
    if (keepOpenWhenHasValue && value) return;
    setOpen(false);
  };

  const handleErase = () => {
    onErase();
    if (collapseOnErase) setOpen(false);
    inputRef.current?.blur();
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
          if (!(keepOpenWhenHasValue && value)) setOpen(false);
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
          onClick={() => setOpen(true)}
        >
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="text-gray-700 dark:text-gray-700-dark"
          />
        </Button>
      ) : (
        <SearchInput
          inputRef={inputRef}
          value={value}
          onChange={onChange}
          onErase={handleErase}
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
