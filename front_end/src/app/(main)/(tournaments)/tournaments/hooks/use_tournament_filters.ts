"use client";

import { useMemo } from "react";

import useSearchParams from "@/hooks/use_search_params";
import { TournamentPreview } from "@/types/projects";

import { filterTournamentsFromParams } from "../helpers/tournament_filters";

type Options = {
  disableClientSort?: boolean;
};

export function useTournamentFilters(
  items: TournamentPreview[],
  opts: Options = {}
) {
  const { params } = useSearchParams();

  const filtered = useMemo(
    () => filterTournamentsFromParams(items, params, opts),
    [items, params, opts]
  );

  return { filtered };
}
