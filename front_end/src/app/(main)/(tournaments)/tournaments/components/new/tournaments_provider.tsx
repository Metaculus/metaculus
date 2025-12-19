"use client";

import React, { createContext, useContext, useMemo } from "react";

import { TournamentPreview } from "@/types/projects";

import { selectTournamentsForSection } from "../../helpers";
import { useTournamentFilters } from "../../hooks/use_tournament_filters";
import { TournamentsSection } from "../../types";

type TournamentsSectionCtxValue = {
  current: TournamentsSection;
  items: TournamentPreview[];
  count: number;
};

const TournamentsSectionCtx = createContext<TournamentsSectionCtxValue | null>(
  null
);

export function TournamentsSectionProvider(props: {
  tournaments: TournamentPreview[];
  current: TournamentsSection;
  children: React.ReactNode;
}) {
  const { tournaments, current, children } = props;

  const sectionItems = useMemo(
    () => selectTournamentsForSection(tournaments, current),
    [tournaments, current]
  );

  const { filtered } = useTournamentFilters(sectionItems);

  const value = useMemo<TournamentsSectionCtxValue>(
    () => ({ current, items: filtered, count: filtered.length }),
    [current, filtered]
  );

  return (
    <TournamentsSectionCtx.Provider value={value}>
      {children}
    </TournamentsSectionCtx.Provider>
  );
}

export function useTournamentsSection() {
  const ctx = useContext(TournamentsSectionCtx);
  if (!ctx) {
    throw new Error(
      "useTournamentsSection must be used within TournamentsSectionProvider"
    );
  }
  return ctx;
}
