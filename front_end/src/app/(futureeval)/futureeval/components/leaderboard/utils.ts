import { StaticImageData } from "next/image";

import metacLogo from "@/app/(main)/aib/assets/ai-models/metaculus_logo.png";
import type { LeaderboardEntry } from "@/types/scoring";

import { getModelDetailsFromScoreEntry } from "./bot_meta";

export const MIN_RESOLVED_FORECASTS = 190;

export function getResolvedCount(entry: Partial<LeaderboardEntry>): number {
  return entry?.contribution_count ?? 0;
}

export function shouldDisplayEntry(
  entry: Partial<LeaderboardEntry>,
  minResolved = MIN_RESOLVED_FORECASTS
): boolean {
  const resolved = getResolvedCount(entry);
  const moreResolved = resolved >= minResolved;
  if (isAggregate(entry) && moreResolved) return true;
  const showFlag = entry?.user?.metadata?.bot_details?.display_in_leaderboard;
  if (!showFlag) return false;
  return moreResolved;
}

/**
 * Extracts the base model name by removing patterns like "high", "max", "extra", "fast", "xhigh"
 * and context length indicators (e.g., "16k", "32k", "128k", "200k").
 *
 * Examples:
 * - "GPT-5 High" -> "GPT-5"
 * - "Claude 4 Sonnet High-16k" -> "Claude 4 Sonnet"
 * - "Qwen 2.5 Max" -> "Qwen 2.5"
 * - "o3 High" -> "o3"
 */
export function getBaseModelName(modelName: string): string {
  if (!modelName) return modelName;

  // Patterns to remove (case-insensitive)
  const patternsToRemove = [
    // Context length indicators (with optional dash/hyphen)
    /\s*-?\s*\d+k\b/gi, // e.g., "16k", "-16k", " 16k"
    /\s*-?\s*\d+[km]b?\b/gi, // e.g., "128k", "200k", "32mb"

    // Quality/tier indicators
    /\s+high\b/gi,
    /\s+xhigh\b/gi,
    /\s+extra\b/gi,
    /\s+fast\b/gi,
    /\s+max\b/gi,
    /\s+ultra\b/gi,
    /\s+premium\b/gi,
    /\s+pro\b/gi,

    // Combined patterns like "high-16k"
    /\s*-?\s*high\s*-?\s*\d+k\b/gi,
    /\s*-?\s*xhigh\s*-?\s*\d+k\b/gi,
  ];

  let cleaned = modelName;

  // Remove patterns
  for (const pattern of patternsToRemove) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Clean up extra spaces and dashes
  cleaned = cleaned
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/\s*-+\s*/g, " ") // Dashes surrounded by spaces
    .replace(/^\s+|\s+$/g, ""); // Trim

  return cleaned || modelName; // Return original if cleaning removes everything
}

/**
 * Gets the label for an entry (server-compatible version without translations).
 */
export function entryLabel(entry: Partial<LeaderboardEntry>): string {
  if (entry.user?.metadata?.bot_details?.base_models?.[0]?.name) {
    return entry.user.metadata.bot_details.base_models[0].name;
  }
  if (entry.user) {
    const meta = getModelDetailsFromScoreEntry(entry);
    return meta?.label ?? entry.user.username;
  }
  const am = (entry.aggregation_method ?? "").toLowerCase();
  if (am.includes("recency") || am.includes("community"))
    return "Metaculus Community";
  if (am.includes("pro")) return "Metaculus Pro Forecasters";
  return entry.aggregation_method ?? "Aggregate";
}

const INVALID_MODEL_NAMES = new Set([
  "n/a",
  "na",
  "none",
  "tbd",
  "unknown",
  "test",
  "",
]);
const UPCOMING_MODEL_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 3 months

function isValidModelName(name: string): boolean {
  return !INVALID_MODEL_NAMES.has(name.trim().toLowerCase());
}

export function getEntryReleaseDate(
  entry: Partial<LeaderboardEntry>
): Date | undefined {
  const raw = entry.user?.metadata?.bot_details?.base_models?.[0]?.releaseDate;
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function isUpcomingCandidate(entry: Partial<LeaderboardEntry>): boolean {
  if (isAggregate(entry)) return false;
  if (shouldDisplayEntry(entry)) return false;
  if (!entry.user?.metadata?.bot_details?.display_in_leaderboard) return false;

  const releaseDate = getEntryReleaseDate(entry);
  if (!releaseDate) return false;
  if (Date.now() - releaseDate.getTime() > UPCOMING_MODEL_MAX_AGE_MS)
    return false;

  const name = entryLabel(entry);
  return isValidModelName(name) && isValidModelName(getBaseModelName(name));
}

/**
 * Gets top N unique base model names from entries that are recently released
 * but haven't yet met the display threshold.
 *
 * Candidates must have display_in_leaderboard=true, a release date within the
 * last 3 months, and a valid (non-placeholder) name.
 *
 * Excludes base models that already appear in the displayed entries.
 * Sorted by: needed forecasts (ascending), then score (descending).
 */
export function getUpcomingModels(
  entries: Partial<LeaderboardEntry>[],
  count = 3
): string[] {
  // Get base model names already displayed in the leaderboard
  const displayedBaseModels = new Set<string>();
  entries
    .filter((e) => shouldDisplayEntry(e))
    .forEach((e) => {
      const baseModel = getBaseModelName(entryLabel(e));
      if (baseModel) displayedBaseModels.add(baseModel);
    });

  const candidates = entries
    .filter(isUpcomingCandidate)
    .map((e) => ({
      baseModel: getBaseModelName(entryLabel(e)),
      needed: MIN_RESOLVED_FORECASTS - (e.contribution_count ?? 0),
      score: e.score ?? 0,
    }))
    .sort((a, b) => a.needed - b.needed || b.score - a.score);

  // Extract unique base models preserving sort order, excluding already displayed ones
  const seen = new Set<string>();
  const result: string[] = [];
  for (const { baseModel } of candidates) {
    if (
      baseModel &&
      !seen.has(baseModel) &&
      !displayedBaseModels.has(baseModel)
    ) {
      seen.add(baseModel);
      result.push(baseModel);
      if (result.length >= count) break;
    }
  }

  return result;
}

export type IconPair = {
  light?: string | StaticImageData;
  dark?: string | StaticImageData;
};

export function isAggregate(entry: Partial<LeaderboardEntry>) {
  return !entry?.user;
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

/**
 * Displayable aggregate entries filtered to Community and Pro Forecasters.
 * Shared across bar chart, performance-over-time chart, and leaderboard table.
 */
export function getDisplayableAggregates(
  entries: LeaderboardEntry[]
): LeaderboardEntry[] {
  return entries.filter((e) => {
    if (!isAggregate(e)) return false;
    if (!shouldDisplayEntry(e)) return false;
    const kind = aggregateKind(e);
    return kind === "community" || kind === "pros";
  });
}

/**
 * Displayable bot entries (non-aggregate, passing display threshold).
 * Shared across bar chart, performance-over-time chart, and leaderboard table.
 */
export function getDisplayableBots(
  entries: LeaderboardEntry[]
): LeaderboardEntry[] {
  return entries.filter((e) => !isAggregate(e) && shouldDisplayEntry(e));
}
