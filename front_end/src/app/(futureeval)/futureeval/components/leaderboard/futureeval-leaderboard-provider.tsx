"use client";

import React, { createContext, useContext } from "react";

import type { LeaderboardDetails } from "@/types/scoring";

type Ctx = { leaderboard: LeaderboardDetails };
const FutureEvalLeaderboardCtx = createContext<Ctx | null>(null);

export function FutureEvalLeaderboardProvider({
  leaderboard,
  children,
}: {
  leaderboard: LeaderboardDetails;
  children: React.ReactNode;
}) {
  return (
    <FutureEvalLeaderboardCtx.Provider value={{ leaderboard }}>
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

