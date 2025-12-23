"use client";

import { useTranslations } from "next-intl";
import React from "react";

import { useTournamentsSection } from "./tournaments_provider";
import { TournamentsSection } from "../../types";

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
  const { current, count } = useTournamentsSection();

  const keys = HERO_KEYS[current];
  if (!keys) return null;

  type RichKey = Parameters<typeof t.rich>[0];
  type PlainKey = Parameters<typeof t>[0];

  return (
    <div className="hidden flex-col gap-5 lg:flex">
      <h1 className="my-0 text-[28px] font-bold leading-[34px] text-blue-800 dark:text-blue-800-dark">
        {t.rich(keys.titleKey as RichKey, {
          br: () => <br />,
        })}
      </h1>

      <p className="my-0 text-base text-gray-700 dark:text-gray-700-dark">
        {t(keys.shownKey as PlainKey, { count })}
      </p>
    </div>
  );
};

export default TournamentsHero;
