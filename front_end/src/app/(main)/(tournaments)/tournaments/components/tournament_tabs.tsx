"use client";

import { useTranslations } from "next-intl";
import React from "react";

import TournamentsTabsShell from "./tournaments-tabs-shell";
import { Section, TournamentsSection } from "../types";

type Props = { current: TournamentsSection };

const TAB_KEYS = {
  live: "tournamentsTabLive",
  series: "tournamentsTabSeries",
  indexes: "tournamentsTabIndexes",
  archived: "tournamentsTabArchived",
} as const satisfies Record<TournamentsSection, string>;

const TournamentsTabs: React.FC<Props> = ({ current }) => {
  const t = useTranslations();
  type PlainKey = Parameters<typeof t>[0];

  const sections: Section[] = [
    {
      value: "live",
      href: "/tournaments",
      label: t(TAB_KEYS.live as PlainKey),
    },
    {
      value: "series",
      href: "/tournaments/question-series",
      label: t(TAB_KEYS.series as PlainKey),
    },
    {
      value: "indexes",
      href: "/tournaments/indexes",
      label: t(TAB_KEYS.indexes as PlainKey),
    },
    {
      value: "archived",
      href: "/tournaments/archived",
      label: t(TAB_KEYS.archived as PlainKey),
    },
  ];

  return <TournamentsTabsShell current={current} sections={sections} />;
};

export default TournamentsTabs;
