import type { LeaderboardEntry } from "@/types/scoring";

import { getModelDetailsFromScoreEntry } from "../../leaderboard/bot_meta";
import { aggregateKind, entryLabel } from "../../leaderboard/utils";

/**
 * Map pre-filtered aggregate entries to chart-ready format.
 */
export function mapAggregates(entries: LeaderboardEntry[]) {
  return entries.map((e) => ({
    name: entryLabel(e),
    aggregateKind: aggregateKind(e) ?? "other",
    score: e.score,
  }));
}
export type MappedAggregates = ReturnType<typeof mapAggregates>;

/**
 * Map pre-filtered bot entries to chart-ready format with release dates.
 * Drops bots without a known release date. Optionally filters by cutoff date.
 */
export function mapBots(entries: LeaderboardEntry[], cutoffDate?: Date) {
  const mapped = entries
    .map((e) => {
      const meta = getModelDetailsFromScoreEntry(e);
      if (!meta?.releasedAt) return null;
      const releaseDate = new Date(meta.releasedAt);
      if (isNaN(releaseDate.getTime())) return null;
      return {
        name: meta.label,
        releaseDate,
        score: e.score,
        family: meta.family,
        familyLabel: meta.familyLabel,
      };
    })
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());

  return cutoffDate
    ? mapped.filter((entry) => entry.releaseDate >= cutoffDate)
    : mapped;
}
export type MappedBots = ReturnType<typeof mapBots>;
