"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

import cn from "@/utils/core/cn";

import { WORLD_BY_YEAR_THEME_CLASSNAME } from "../components/theme";
import { useWorldYear } from "../components/world_year_provider";
import { FORECASTS_READ_AT } from "../data/questions";

export function FooterSection() {
  const t = useTranslations();
  const locale = useLocale();
  const { scrubbing } = useWorldYear();
  const readDate = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(FORECASTS_READ_AT),
    [locale]
  );

  return (
    <footer
      className={cn(
        WORLD_BY_YEAR_THEME_CLASSNAME,
        "bg-[var(--wby-bg)] font-sans"
      )}
    >
      <div className="mx-auto w-full max-w-[1280px] px-[var(--wby-pad)]">
        <p
          className={cn(
            "m-0 pb-[120px] pt-[18px] text-[12px] leading-[normal] text-[var(--wby-muted)] transition-opacity duration-[220ms] ease-[ease]",
            scrubbing && "pointer-events-none opacity-30"
          )}
        >
          {t("worldByYearFooterNote", { readDate })}
        </p>
      </div>
    </footer>
  );
}
