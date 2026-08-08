"use client";

import { faList, faTableCells } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

export type FeedLayout = "list" | "grid";

type Props = {
  value: FeedLayout;
  onChange: (layout: FeedLayout) => void;
  className?: string;
};

const LayoutSwitcher: FC<Props> = ({ value, onChange, className }) => {
  const t = useTranslations();
  const nextValue = value === "list" ? "grid" : "list";

  return (
    <button
      type="button"
      aria-label={nextValue === "list" ? t("listLayout") : t("gridLayout")}
      onClick={() => onChange(nextValue)}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-full border border-blue-400 bg-gray-0 p-1 dark:border-blue-400-dark dark:bg-gray-0-dark",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-sm transition-colors",
          value === "list"
            ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
            : "text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon icon={faList} />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-sm transition-colors",
          value === "grid"
            ? "bg-blue-800 text-gray-0 dark:bg-blue-800-dark dark:text-gray-0-dark"
            : "text-blue-700 hover:text-blue-800 dark:text-blue-700-dark dark:hover:text-blue-800-dark"
        )}
      >
        <FontAwesomeIcon icon={faTableCells} />
      </span>
    </button>
  );
};

export default LayoutSwitcher;
