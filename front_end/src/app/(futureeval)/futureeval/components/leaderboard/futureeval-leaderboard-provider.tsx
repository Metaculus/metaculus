"use client";

import React, { createContext, useContext, useMemo } from "react";

import type { LeaderboardDetails } from "@/types/scoring";

import {
  getDisplayableAggregates,
  getDisplayableBots,
  getUpcomingModels,
} from "./utils";
import {
  mapAggregates,
  mapBots,
  type MappedAggregates,
  type MappedBots,
} from "../benchmark/performance-over-time/mapping";
import { computeSotaCrossingDates } from "../benchmark/performance-over-time/sota-trend";

const BOT_RELEASE_CUTOFF = new Date("2024-01-01");

type SotaCrossingDates = {
  communityDate: string | null;
  proDate: string | null;
};

type Ctx = {
  aggregates: LeaderboardDetails["entries"];
  bots: LeaderboardDetails["entries"];
  mappedAggregates: MappedAggregates;
  mappedBots: MappedBots;
  upcomingModels: string[];
  sotaCrossingDates: SotaCrossingDates;
};
const FutureEvalLeaderboardCtx = createContext<Ctx | null>(null);

export function FutureEvalLeaderboardProvider({
  leaderboard,
  children,
}: {
  leaderboard: LeaderboardDetails;
  children: React.ReactNode;
}) {
  const entries = useMemo(
    () => leaderboard.entries ?? [],
    [leaderboard.entries]
  );

  const aggregates = useMemo(
    () => getDisplayableAggregates(entries),
    [entries]
  );
  const bots = useMemo(() => getDisplayableBots(entries), [entries]);
  const mappedAggregates = useMemo(
    () => mapAggregates(aggregates),
    [aggregates]
  );
  const mappedBots = useMemo(() => mapBots(bots, BOT_RELEASE_CUTOFF), [bots]);
  const upcomingModels = useMemo(() => getUpcomingModels(entries), [entries]);
  const sotaCrossingDates = useMemo(
    () => computeSotaCrossingDates(mappedAggregates, mappedBots),
    [mappedAggregates, mappedBots]
  );

  const value = useMemo(
    () => ({
      aggregates,
      bots,
      mappedAggregates,
      mappedBots,
      upcomingModels,
      sotaCrossingDates,
    }),
    [
      aggregates,
      bots,
      mappedAggregates,
      mappedBots,
      upcomingModels,
      sotaCrossingDates,
    ]
  );

  return (
    <FutureEvalLeaderboardCtx.Provider value={value}>
      {children}
    </FutureEvalLeaderboardCtx.Provider>
  );
}

export function useFutureEvalLeaderboard() {
  const ctx = useContext(FutureEvalLeaderboardCtx);
  if (!ctx)
    throw new Error(
      "useFutureEvalLeaderboard must be used inside FutureEvalLeaderboardProvider"
    );
  return ctx;
}
