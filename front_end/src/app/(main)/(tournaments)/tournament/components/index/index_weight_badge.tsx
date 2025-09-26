"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

type Props = {
  value: number;
  className?: string;
};

const WeightBadge: FC<Props> = ({ value, className }) => {
  const t = useTranslations();
  return (
    <div className={cn("flex items-center gap-[6px]", className)}>
      <span className="text-xs font-medium capitalize text-gray-500 dark:text-gray-500-dark">
        {t("weight")}:
      </span>
      <span className="rounded-[2px] bg-gray-500 px-1 py-[2px] text-sm font-semibold text-gray-0 dark:bg-gray-500-dark dark:text-gray-0-dark">
        {Number(value).toFixed(1)}x
      </span>
    </div>
  );
};

export default WeightBadge;
