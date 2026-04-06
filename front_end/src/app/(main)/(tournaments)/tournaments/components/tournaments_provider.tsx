"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

import useSearchParams from "@/hooks/use_search_params";
import { TournamentPreview } from "@/types/projects";

import { TOURNAMENTS_SEARCH } from "../constants/query_params";
import { selectTournamentsForSection } from "../helpers";
import { filterTournaments } from "../helpers/tournament_filters";
import { useTournamentFilters } from "../hooks/use_tournament_filters";
import { TournamentsSection } from "../types";

type TournamentsSectionCtxValue = {
  current: TournamentsSection;
  items: TournamentPreview[];
  count: number;
  nowTs?: number;
  isSearching: boolean;
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
  const { params } = useSearchParams();

  const searchQuery = (params.get(TOURNAMENTS_SEARCH) ?? "").trim();
  const isSearching = searchQuery.length > 0;

  const sectionItems = useMemo(
    () => selectTournamentsForSection(tournaments, current),
    [tournaments, current]
  );

  const { filtered } = useTournamentFilters(sectionItems);

  const crossTabFiltered = useMemo(
    () =>
      isSearching ? filterTournaments(tournaments, searchQuery, null) : [],
    [tournaments, searchQuery, isSearching]
  );

  const items = isSearching ? crossTabFiltered : filtered;

  const value = useMemo<TournamentsSectionCtxValue>(
    () => ({
      current,
      items,
      count: items.length,
      isSearching,
      infoOpen,
      nowTs,
      toggleInfo: () => setInfoOpen((v) => !v),
      closeInfo: () => setInfoOpen(false),
    }),
    [current, items, isSearching, infoOpen, nowTs]
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
