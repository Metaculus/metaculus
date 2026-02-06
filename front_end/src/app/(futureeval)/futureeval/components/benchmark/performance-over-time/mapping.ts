import type { LeaderboardDetails } from "@/types/scoring";

import { getModelDetailsFromScoreEntry } from "../../leaderboard/bot_meta";
import { entryLabel, shouldDisplayEntry } from "../../leaderboard/utils";

export function getAggregates(leaderboard: LeaderboardDetails) {
  return leaderboard.entries
    .filter((e) => !e.user && shouldDisplayEntry(e))
    .map((e) => {
      const name = entryLabel(e);
      const aggregationMethod = String(
        e.aggregation_method ?? ""
      ).toLowerCase();
      const aggregateKind =
        aggregationMethod.includes("recency") ||
        aggregationMethod.includes("community")
          ? "community"
          : aggregationMethod.includes("pro")
            ? "pros"
            : "other";

      return {
        name,
        aggregateKind,
        score: e.score,
      };
    });
}
export type MappedAggregates = ReturnType<typeof getAggregates>;

export function getBots(leaderboard: LeaderboardDetails, cutoffDate?: Date) {
  const entries = leaderboard.entries
    .filter((e) => e.user && shouldDisplayEntry(e))
    .map((e) => {
      const meta = getModelDetailsFromScoreEntry(e);
      if (!meta?.releasedAt) return null;
      return {
        name: meta.label,
        releaseDate: new Date(meta.releasedAt),
        score: e.score,
        family: meta.family,
        familyLabel: meta.familyLabel,
      };
    })
    .filter((m): m is NonNullable<typeof m> => !!m)
    .sort((a, b) => a.releaseDate.getTime() - b.releaseDate.getTime());

  return cutoffDate
    ? entries.filter((entry) => entry.releaseDate >= cutoffDate)
    : entries;
}
export type MappedBots = ReturnType<typeof getBots>;
