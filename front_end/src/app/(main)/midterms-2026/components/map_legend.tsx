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
        // Stack vertically by default so the legend wraps cleanly when it
        // would otherwise collide with the chamber tabs at narrow widths.
        // Switches to a horizontal row at xl+ where there's plenty of room.
        "flex flex-col items-end gap-1.5 text-xs text-blue-700 dark:text-blue-700-dark xl:flex-row xl:items-center xl:gap-4",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: MIDTERMS_COLORS.spectrumDem }}
        />
        {t("midtermsHubDemocrat")}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: MIDTERMS_COLORS.spectrumRep }}
        />
        {t("midtermsHubRepublican")}
      </span>
    </div>
  );
};

export default MapLegend;
