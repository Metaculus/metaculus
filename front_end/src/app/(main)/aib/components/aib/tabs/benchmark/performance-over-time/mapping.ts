import type { LeaderboardDetails } from "@/types/scoring";

import { getBotMeta } from "../../../leaderboard/bot_meta";

export type AggregateKind = "community" | "pros" | "other";

export type ModelPoint = {
  name: string;
  releaseDate: Date | string;
  score: number;
  isAggregate?: boolean;
  aggregateKind?: AggregateKind;
};

type MaybeAgg = { aggregation_method?: string | null };

export function mapLeaderboardToModelPoints(
  leaderboard: LeaderboardDetails
): ModelPoint[] {
  const entries: ModelPoint[] = [];
  for (const e of leaderboard.entries) {
    const username = e.user?.username;
    const meta = username ? getBotMeta(username) : undefined;
    if (!meta?.releasedAt) continue;

    const isAggregate = !username;
    const amRaw = (e as MaybeAgg).aggregation_method ?? "";
    const am = typeof amRaw === "string" ? amRaw.toLowerCase() : "";

    let aggregateKind: AggregateKind | undefined;
    if (isAggregate) {
      if (am.includes("recency") || am.includes("community"))
        aggregateKind = "community";
      else if (am.includes("pro")) aggregateKind = "pros";
      else aggregateKind = "other";
    }

    const defaultAggregateLabel =
      aggregateKind === "community"
        ? "Community aggregate"
        : aggregateKind === "pros"
          ? "Pros aggregate"
          : "Aggregate";

    const name =
      meta?.label ??
      username ??
      (isAggregate ? defaultAggregateLabel : "Unnamed Model");

    entries.push({
      name,
      releaseDate: meta.releasedAt,
      score: e.score,
      isAggregate,
      aggregateKind,
    });
  }

  entries.sort(
    (a, b) =>
      new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );

  return entries;
}
