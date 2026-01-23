import { differenceInMilliseconds } from "date-fns";

import { TournamentPreview, TournamentsSortBy } from "@/types/projects";

import {
  TOURNAMENTS_SEARCH,
  TOURNAMENTS_SORT,
} from "../constants/query_params";

import { safeTs } from ".";

type ParamsLike = Pick<URLSearchParams, "get">;

type Options = {
  disableClientSort?: boolean;
  defaultSort?: TournamentsSortBy;
};

export function filterTournamentsFromParams(
  items: TournamentPreview[],
  params: ParamsLike,
  opts: Options = {}
) {
  const searchString = params.get(TOURNAMENTS_SEARCH) ?? "";

  const sortBy: TournamentsSortBy | null = opts.disableClientSort
    ? null
    : (params.get(TOURNAMENTS_SORT) as TournamentsSortBy | null) ??
      opts.defaultSort ??
      TournamentsSortBy.Featured;

  return filterTournaments(items, decodeURIComponent(searchString), sortBy);
}

export function filterTournaments(
  items: TournamentPreview[],
  searchString: string,
  sortBy: TournamentsSortBy | null
) {
  let filtered = items;

  if (searchString) {
    const sanitized = searchString.trim().toLowerCase();
    const words = sanitized.split(/\s+/);

    filtered = items.filter((item) =>
      words.every((word) => item.name.toLowerCase().includes(word))
    );
  }

  if (!sortBy) return filtered;

  const ts = Date.now();

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case TournamentsSortBy.PrizePoolDesc:
        return Number(b.prize_pool) - Number(a.prize_pool);

      case TournamentsSortBy.CloseDateAsc:
        return differenceInMilliseconds(
          new Date(a.close_date ?? 0),
          new Date(b.close_date ?? 0)
        );

      case TournamentsSortBy.StartDateDesc:
        return differenceInMilliseconds(
          new Date(b.start_date),
          new Date(a.start_date)
        );

      case TournamentsSortBy.Featured: {
        // 1) Open tournaments first
        const statusDiff = statusRank(a, ts) - statusRank(b, ts);
        if (statusDiff !== 0) return statusDiff;

        // 2) Admin order (undefined last)
        const orderDiff = orderValue(a) - orderValue(b);
        if (orderDiff !== 0) return orderDiff;

        // 3) Earlier-in-run first (smaller % passed ranks higher)
        const pctDiff = durationPctPassed(a, ts) - durationPctPassed(b, ts);
        if (pctDiff !== 0) return pctDiff;

        return differenceInMilliseconds(
          new Date(b.start_date),
          new Date(a.start_date)
        );
      }

      default:
        return 0;
    }
  });
}

const statusRank = (t: TournamentPreview, nowTs: number): number => {
  if (t.timeline?.all_questions_resolved) return 2;

  const endTs = safeTs(t.close_date ?? t.forecasting_end_date);
  const closedByDate = endTs != null ? nowTs >= endTs : false;
  const closedByTimeline = !!t.timeline?.all_questions_closed;

  const isOpen = !(closedByDate || closedByTimeline);
  return isOpen ? 0 : 1;
};

const orderValue = (t: TournamentPreview): number =>
  t.order == null ? Number.POSITIVE_INFINITY : t.order;

const durationPctPassed = (t: TournamentPreview, nowTs: number): number => {
  const startTs = safeTs(t.start_date);
  const endTs = safeTs(t.close_date ?? t.forecasting_end_date);
  if (startTs == null || endTs == null || endTs <= startTs) {
    return Number.POSITIVE_INFINITY;
  }

  const raw = (nowTs - startTs) / (endTs - startTs);
  if (!Number.isFinite(raw)) return Number.POSITIVE_INFINITY;
  return Math.min(1, Math.max(0, raw));
};
