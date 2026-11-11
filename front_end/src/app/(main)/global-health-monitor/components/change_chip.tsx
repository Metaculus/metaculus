"use client";

import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
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

  // Only movement is worth a chip.
  if (change.direction === "steady") {
    return null;
  }

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
        SENTIMENT_CLASS_NAMES[change.sentiment],
        className
      )}
    >
      <FontAwesomeIcon
        icon={change.direction === "up" ? faArrowUp : faArrowDown}
        className="size-2.5"
      />
      {change.text}
    </span>
  );
}
