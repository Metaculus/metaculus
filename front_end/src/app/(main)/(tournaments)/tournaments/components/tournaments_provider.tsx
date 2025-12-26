"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

import { TournamentPreview } from "@/types/projects";

import { selectTournamentsForSection } from "../helpers";
import { useTournamentFilters } from "../hooks/use_tournament_filters";
import { TournamentsSection } from "../types";

type TournamentsSectionCtxValue = {
  current: TournamentsSection;
  items: TournamentPreview[];
  count: number;
  nowTs?: number;
  infoOpen: boolean;
  toggleInfo: () => void;
  closeInfo: () => void;
};

const TournamentsSectionCtx = createContext<TournamentsSectionCtxValue | null>(
  null
);

export function TournamentsSectionProvider(props: {
  tournaments: TournamentPreview[];
  current: TournamentsSection;
  children: React.ReactNode;
  nowTs?: number;
}) {
  const { tournaments, current, children, nowTs } = props;
  const [infoOpen, setInfoOpen] = useState(true);

  const sectionItems = useMemo(
    () => selectTournamentsForSection(tournaments, current),
    [tournaments, current]
  );

  const { filtered } = useTournamentFilters(sectionItems);

  const value = useMemo<TournamentsSectionCtxValue>(
    () => ({
      current,
      items: filtered,
      count: filtered.length,
      infoOpen,
      nowTs,
      toggleInfo: () => setInfoOpen((v) => !v),
      closeInfo: () => setInfoOpen(false),
    }),
    [current, filtered, infoOpen, nowTs]
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
