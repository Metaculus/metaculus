"use client";

import { faCircle } from "@fortawesome/free-regular-svg-icons";
import { faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/button";
import Tooltip from "@/components/ui/tooltip";
import cn from "@/utils/core/cn";

type Props = { className?: string };

export default function MedalRankInfoTooltip({ className }: Props) {
  const t = useTranslations();
  return (
    <Tooltip
      placement="bottom-end"
      showDelayMs={150}
      tooltipClassName="bg-gray-0 p-4 dark:bg-gray-0"
      tooltipContent={
        <div className="max-w-[300px] text-sm text-gray-700 dark:text-gray-700-dark">
          <p className="m-0 mb-5">{t("medalRank")}</p>
          <Link
            href="/faq/#whatmedalranks"
            className="text-blue-700 dark:text-blue-700-dark"
          >
            {t("learnMoreFAQ")}
          </Link>
        </div>
      }
    >
      <Button
        type="button"
        aria-label="How medal ranks are calculated"
        variant="text"
        presentationType="icon"
        size="xxs"
        className={cn("border-none", className)}
      >
        <span className="relative">
          <FontAwesomeIcon
            icon={faCircle}
            className="h-5 w-5 text-blue-800 dark:text-blue-800-dark"
          />
          <FontAwesomeIcon
            icon={faInfo}
            className="absolute right-[20%] top-[48%] h-3 w-3 -translate-y-1/2 text-blue-800 dark:text-blue-800-dark"
          />
        </span>
      </Button>
    </Tooltip>
  );
}
