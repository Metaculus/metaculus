"use client";

import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { TokenDatum } from "../helpers/snapshot";

/** Takes the place of a resolved question's change chip, in Metaculus' resolution purple. */
export function ResolvedChip({
  resolution,
  className,
}: {
  resolution: NonNullable<TokenDatum["resolution"]>;
  className?: string;
}) {
  const t = useTranslations();

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm bg-purple-200 px-1.5 py-0.5 text-xs font-medium leading-4 text-purple-800 dark:bg-purple-200-dark dark:text-purple-800-dark",
        className
      )}
    >
      <FontAwesomeIcon icon={faCircleCheck} className="size-2.5" />
      {t("globalHealthMonitorResolvedAs", { value: resolution.display })}
    </span>
  );
}
