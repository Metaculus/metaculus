"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { MIDTERMS_COLORS } from "../constants";

type Props = {
  className?: string;
};

const MapLegend: FC<Props> = ({ className }) => {
  const t = useTranslations();
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 text-xs text-blue-700 dark:text-blue-700-dark",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: MIDTERMS_COLORS.demPrimary }}
        />
        {t("midtermsHubDemocrat")}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: MIDTERMS_COLORS.repPrimary }}
        />
        {t("midtermsHubRepublican")}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full border border-blue-400 dark:border-blue-400-dark"
          style={{ backgroundColor: MIDTERMS_COLORS.notContested }}
        />
        {t("midtermsHubNotContested")}
      </span>
    </div>
  );
};

export default MapLegend;
