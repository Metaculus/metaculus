"use client";

import { StaticImageData } from "next/image";
import { useTranslations } from "next-intl";

import metacLogo from "@/app/(main)/aib/assets/ai-models/metaculus_logo.png";
import type { LeaderboardEntry } from "@/types/scoring";

import { getBotMeta } from "./bot_meta";

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
  entry: LeaderboardEntry,
  t: ReturnType<typeof useTranslations>
): string {
  if (entry.user?.metadata?.bot_details?.base_models?.[0]?.name) {
    return entry.user.metadata.bot_details.base_models[0].name;
  }
  if (entry.user) {
    const meta = getBotMeta(entry.user.username);
    return meta?.label ?? entry.user.username;
  }
  const kind = aggregateKind(entry);
  if (kind === "community") return t("communityPrediction");
  if (kind === "pros") return "Pros aggregate";
  return entry.aggregation_method ?? "Aggregate";
}

export function entryIconPair(entry: LeaderboardEntry): IconPair {
  if (isAggregate(entry)) {
    const kind = aggregateKind(entry);
    if (kind === "community" || kind === "pros")
      return { light: metacLogo, dark: metacLogo };
  }
  const username = entry.user?.username ?? "";
  const meta = username ? getBotMeta(username) : null;
  return { light: meta?.iconLight, dark: meta?.iconDark ?? meta?.iconLight };
}

export function entryForecasts(entry: LeaderboardEntry) {
  return entry.coverage ?? entry.contribution_count ?? 0;
}

export const MIN_RESOLVED_FORECASTS = 100;

export function getResolvedCount(entry: Partial<LeaderboardEntry>): number {
  return entry?.contribution_count ?? 0;
}

export function isAggregateEntry(entry: Partial<LeaderboardEntry>): boolean {
  return !entry?.user?.username;
}

export function shouldDisplayEntry(
  entry: Partial<LeaderboardEntry>,
  minResolved = MIN_RESOLVED_FORECASTS
): boolean {
  if (isAggregateEntry(entry)) return true;
  const showFlag = entry?.user?.metadata?.bot_details?.display_in_leaderboard;
  if (!showFlag) return false;
  const resolved = getResolvedCount(entry);
  return resolved >= minResolved;
}
