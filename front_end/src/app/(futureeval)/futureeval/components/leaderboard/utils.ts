"use client";

import { StaticImageData } from "next/image";
import { useTranslations } from "next-intl";

import metacLogo from "@/app/(main)/aib/assets/ai-models/metaculus_logo.png";
import type { LeaderboardEntry } from "@/types/scoring";

import { getModelDetailsFromScoreEntry } from "./bot_meta";

// Re-export shared utilities for client components
export {
  MIN_RESOLVED_FORECASTS,
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

export function entryLabel(
  entry: Partial<LeaderboardEntry>,
  t?: ReturnType<typeof useTranslations>
): string {
  if (entry.user?.metadata?.bot_details?.base_models?.[0]?.name) {
    return entry.user.metadata.bot_details.base_models[0].name;
  }
  if (entry.user) {
    const meta = getModelDetailsFromScoreEntry(entry);
    return meta?.label ?? entry.user.username;
  }
  const kind = aggregateKind(entry as LeaderboardEntry);
  if (kind === "community")
    return t ? t("communityPrediction") : "Community Prediction";
  if (kind === "pros") return t ? t("aibLegendPros") : "Pro Forecasters";
  return entry.aggregation_method ?? "Aggregate";
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
