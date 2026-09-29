"use client";

import {
  faArrowDown,
  faArrowUp,
  faEquals,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { TokenChange } from "../helpers/snapshot";

const SENTIMENT_CLASS_NAMES = {
  worse:
    "bg-salmon-200 text-salmon-800 dark:bg-salmon-200-dark dark:text-salmon-800-dark",
  better:
    "bg-olive-300 text-olive-900 dark:bg-olive-300-dark dark:text-olive-900-dark",
  neutral:
    "bg-blue-200 text-blue-800 dark:bg-blue-200-dark dark:text-blue-800-dark",
} as const;

export function ChangeChip({
  change,
  sinceLabel,
  className,
}: {
  change: TokenChange;
  sinceLabel?: string;
  className?: string;
}) {
  const t = useTranslations();
  const isSteady = change.direction === "steady";
  const icon =
    change.direction === "up"
      ? faArrowUp
      : change.direction === "down"
        ? faArrowDown
        : faEquals;

  return (
    <span
      title={
        sinceLabel
          ? t("globalHealthMonitorChangeSince", {
              change: change.text,
              date: sinceLabel,
            })
          : change.text
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm px-1.5 py-0.5 text-xs font-medium leading-4",
        isSteady
          ? "bg-gray-200 text-gray-700 dark:bg-gray-200-dark dark:text-gray-700-dark"
          : SENTIMENT_CLASS_NAMES[change.sentiment],
        className
      )}
    >
      <FontAwesomeIcon icon={icon} className="size-2.5" />
      {isSteady ? t("globalHealthMonitorSteady") : change.text}
    </span>
  );
}
