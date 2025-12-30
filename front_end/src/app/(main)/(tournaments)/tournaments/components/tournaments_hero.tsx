"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { useBreakpoint } from "@/hooks/tailwind";

import { useTournamentsSection } from "./tournaments_provider";
import { TournamentsSection } from "../types";

const HERO_KEYS = {
  live: {
    titleKey: "tournamentsHeroLiveTitle",
    shownKey: "tournamentsHeroLiveShown",
  },
  series: {
    titleKey: "tournamentsHeroSeriesTitle",
    shownKey: "tournamentsHeroSeriesShown",
  },
  indexes: {
    titleKey: "tournamentsHeroIndexesTitle",
    shownKey: "tournamentsHeroIndexesShown",
  },
  archived: null,
} as const satisfies Record<
  TournamentsSection,
  { titleKey: string; shownKey: string } | null
>;

const TournamentsHero: React.FC = () => {
  const t = useTranslations();
  const isLg = useBreakpoint("lg");
  const { current, count } = useTournamentsSection();

  const keys = HERO_KEYS[current];
  if (!keys) return null;
  if (!isLg && current === "live") return null;

  type RichKey = Parameters<typeof t.rich>[0];
  type PlainKey = Parameters<typeof t>[0];

  return (
    <div className="flex-col gap-5 lg:flex">
      <h1 className="my-5 ml-1 text-[20px] font-bold leading-[125%] text-blue-800 dark:text-blue-800-dark sm:text-[24px] lg:my-0 lg:ml-0 lg:text-[28px] lg:leading-[34px]">
        {t.rich(keys.titleKey as RichKey, {
          br: () => <br />,
        })}
      </h1>

      <p className="my-0 hidden text-base text-gray-700 dark:text-gray-700-dark lg:block">
        {t(keys.shownKey as PlainKey, { count })}
      </p>
    </div>
  );
};

export default TournamentsHero;
