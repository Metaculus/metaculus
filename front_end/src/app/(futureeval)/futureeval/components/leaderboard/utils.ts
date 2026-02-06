"use client";

import { StaticImageData } from "next/image";

import metacLogo from "@/app/(main)/aib/assets/ai-models/metaculus_logo.png";
import type { LeaderboardEntry } from "@/types/scoring";

import { getModelDetailsFromScoreEntry } from "./bot_meta";

// Re-export shared utilities for client components
export {
  MIN_RESOLVED_FORECASTS,
  entryLabel,
  getBaseModelName,
  getResolvedCount,
  getUpcomingModels,
  isAggregateEntry,
  shouldDisplayEntry,
} from "./utils.shared";

export type IconPair = {
  light?: string | StaticImageData;
  dark?: string | StaticImageData;
};

export function isAggregate(entry: LeaderboardEntry) {
  return !entry.user;
}

export function aggregateKind(
  entry: LeaderboardEntry
): "community" | "pros" | "other" | undefined {
  if (!isAggregate(entry)) return undefined;
  const am = (entry.aggregation_method ?? "").toLowerCase();
  if (am.includes("recency") || am.includes("community")) return "community";
  if (am.includes("pro")) return "pros";
  return "other";
}

export function entryIconPair(entry: LeaderboardEntry): IconPair {
  if (isAggregate(entry)) {
    const kind = aggregateKind(entry);
    if (kind === "community" || kind === "pros")
      return { light: metacLogo, dark: metacLogo };
  }
  const meta = getModelDetailsFromScoreEntry(entry);
  return { light: meta?.iconLight, dark: meta?.iconDark };
}

export function entryForecasts(entry: LeaderboardEntry) {
  return entry.coverage ?? entry.contribution_count ?? 0;
}
