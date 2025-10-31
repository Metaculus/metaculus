"use client";

import React, { createContext, useContext } from "react";

import type { LeaderboardDetails } from "@/types/scoring";

type Ctx = { leaderboard: LeaderboardDetails };
const AIBLeaderboardCtx = createContext<Ctx | null>(null);

export function AIBLeaderboardProvider({
  leaderboard,
  children,
}: {
  leaderboard: LeaderboardDetails;
  children: React.ReactNode;
}) {
  return (
    <AIBLeaderboardCtx.Provider value={{ leaderboard }}>
      {children}
    </AIBLeaderboardCtx.Provider>
  );
}

export function useAIBLeaderboard() {
  const ctx = useContext(AIBLeaderboardCtx);
  if (!ctx)
    throw new Error(
      "useAIBLeaderboard must be used inside AIBLeaderboardProvider"
    );
  return ctx;
}
