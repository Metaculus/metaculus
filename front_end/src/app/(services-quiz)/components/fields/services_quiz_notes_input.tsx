"use client";

import { faPen, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FC, useCallback, useLayoutEffect, useRef } from "react";

import cn from "@/utils/core/cn";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  minHeightClassName?: string;
  maxHeightPx?: number;
};

const ServicesQuizNotesInput: FC<Props> = ({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  minHeightClassName = "min-h-[56px]",
  maxHeightPx,
}) => {
  const hasValue = value.trim().length > 0;
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = el.scrollHeight;
    const capped =
      typeof maxHeightPx === "number" ? Math.min(next, maxHeightPx) : next;

    el.style.height = `${capped}px`;
    el.style.overflowY =
      typeof maxHeightPx === "number" && next > maxHeightPx ? "auto" : "hidden";
  }, [maxHeightPx]);

  useLayoutEffect(() => {
    resize();
  }, [resize, value]);

  return (
    <div className={cn("relative", className)}>
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full resize-none rounded-lg px-4 py-4 pr-12 text-base leading-5 outline-none transition-colors",
          minHeightClassName,
          "bg-blue-500/20 text-blue-800 placeholder:text-blue-800/40",
          "dark:bg-blue-500-dark/20 dark:text-blue-800-dark dark:placeholder:text-blue-800-dark/40",
          "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400-dark",
          disabled && "cursor-not-allowed opacity-50"
        )}
        style={{ overflow: "hidden" }}
      />

      <div className="absolute right-4 top-4">
        {hasValue ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange("")}
            aria-label="Clear"
            className={cn(
              "-mt-0.5 rounded p-1 outline-none transition-opacity",
              "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400-dark",
              disabled ? "opacity-50" : "hover:opacity-80"
            )}
          >
            <FontAwesomeIcon
              className="text-[20px] text-salmon-800 dark:text-salmon-800-dark"
              icon={faXmark}
            />
          </button>
        ) : (
          <FontAwesomeIcon
            className="text-[20px] text-blue-500/60 dark:text-blue-500-dark/60"
            icon={faPen}
          />
        )}
      </div>
    </div>
  );
};

export default ServicesQuizNotesInput;
