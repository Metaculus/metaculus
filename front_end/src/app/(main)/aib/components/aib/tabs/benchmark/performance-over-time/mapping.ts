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
  leaderboard: LeaderboardDetails,
  opts: Options = { fallbackToCalculatedOn: true, mockTemporalSpread: true }
): ModelPoint[] {
  const {
    fallbackToCalculatedOn = true,
    mockTemporalSpread = true,
    mockWindow,
  } = opts;

  const raw: ModelPoint[] = [];
  for (const e of leaderboard.entries) {
    const username = e.user?.username;
    const meta = username ? getBotMeta(username) : undefined;

    const releaseDate =
      meta?.releasedAt ??
      (fallbackToCalculatedOn ? e.calculated_on : undefined);
    if (!releaseDate) continue;

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

    raw.push({
      name,
      releaseDate,
      score: e.score,
      isAggregate,
      aggregateKind,
    });
  }

  const spread: ModelPoint[] = mockTemporalSpread
    ? spreadDatesIfClustered<ModelPoint>(raw, mockWindow)
    : raw;

  spread.sort(
    (a, b) =>
      new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  );

  return spread;
}

type Options = {
  fallbackToCalculatedOn?: boolean;
  mockTemporalSpread?: boolean;
  mockWindow?: { start?: string; end?: string };
};

export function spreadDatesIfClustered<
  T extends { name: string; releaseDate: string | Date },
>(points: T[], opts?: { start?: string | Date; end?: string | Date }): T[] {
  if (points.length <= 1) return points;

  const dates = points.map((p) => new Date(p.releaseDate));
  const minT = Math.min(...dates.map((d) => d.getTime()));
  const maxT = Math.max(...dates.map((d) => d.getTime()));

  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const clustered = maxT - minT < THREE_DAYS;
  if (!clustered) return points;

  const start = opts?.start ? new Date(opts.start) : new Date("2024-07-01");
  const end = opts?.end ? new Date(opts.end) : new Date("2025-07-01");
  const span = Math.max(1, end.getTime() - start.getTime());
  const step = span / Math.max(1, points.length - 1);

  return points.map((p, i) => ({
    ...p,
    releaseDate: new Date(start.getTime() + step * i).toISOString(),
  }));
}
