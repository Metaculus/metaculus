import { differenceInMilliseconds } from "date-fns";

import { TournamentPreview, TournamentsSortBy } from "@/types/projects";

import {
  TOURNAMENTS_SEARCH,
  TOURNAMENTS_SORT,
} from "../constants/query_params";

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
      TournamentsSortBy.StartDateDesc;

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

      default:
        return 0;
    }
  });
}
