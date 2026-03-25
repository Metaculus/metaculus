"use client";

import { faList, faTableCells } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

import cn from "@/utils/core/cn";

export type FeedLayout = "list" | "grid";

type Props = {
  value: FeedLayout;
  onChange: (layout: FeedLayout) => void;
  className?: string;
};

const LayoutSwitcher: FC<Props> = ({ value, onChange, className }) => {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-blue-400 bg-gray-0 p-1 dark:border-blue-400-dark dark:bg-gray-0-dark",
        className
      )}
    >
      <button
        type="button"
        aria-label="List layout"
        onClick={() => onChange("list")}
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-sm transition-colors",
          value === "list"
            ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
            : "text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon icon={faList} />
      </button>
      <button
        type="button"
        aria-label="Grid layout"
        onClick={() => onChange("grid")}
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-sm transition-colors",
          value === "grid"
            ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
            : "text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon icon={faTableCells} />
      </button>
    </div>
  );
};

export default LayoutSwitcher;
