import type { LeaderboardDetails } from "@/types/scoring";

import { getBotMeta } from "../../../leaderboard/bot_meta";

export type ModelPoint = {
  name: string;
  releaseDate: Date | string;
  score: number;
};

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
    if (!username) continue;

    const meta = getBotMeta(username);
    const releaseDate =
      meta.releasedAt ?? (fallbackToCalculatedOn ? e.calculated_on : undefined);
    if (!releaseDate) continue;

    raw.push({
      name: meta.label,
      releaseDate,
      score: e.score,
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
