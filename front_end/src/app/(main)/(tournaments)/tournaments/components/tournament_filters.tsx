"use client";
import { useTranslations } from "next-intl";
import { ChangeEvent, FC } from "react";

import SearchInput from "@/components/search_input";
import Listbox, { SelectOption } from "@/components/ui/listbox";
import useSearchInputState from "@/hooks/use_search_input_state";
import useSearchParams from "@/hooks/use_search_params";
import { TournamentsSortBy } from "@/types/projects";

import {
  TOURNAMENTS_SEARCH,
  TOURNAMENTS_SORT,
} from "../constants/query_params";

const TournamentFilters: FC = () => {
  const t = useTranslations();
  const { params, setParam, shallowNavigateToSearchParams } = useSearchParams();

  const [searchQuery, setSearchQuery] = useSearchInputState(
    TOURNAMENTS_SEARCH,
    { mode: "client", debounceTime: 300 }
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  const handleSearchErase = () => {
    setSearchQuery("");
  };

  const sortBy =
    (params.get(TOURNAMENTS_SORT) as TournamentsSortBy) ??
    TournamentsSortBy.StartDateDesc;
  const sortOptions: SelectOption<TournamentsSortBy>[] = [
    {
      label: t("highestPrizePool"),
      value: TournamentsSortBy.PrizePoolDesc,
    },
    {
      label: t("endingSoon"),
      value: TournamentsSortBy.CloseDateAsc,
    },
    {
      label: t("newest"),
      value: TournamentsSortBy.StartDateDesc,
    },
  ];
  const handleSortByChange = (value: TournamentsSortBy) => {
    setParam(TOURNAMENTS_SORT, value, false);
    shallowNavigateToSearchParams();
  };

  return (
    <div className="my-8 flex flex-col items-end justify-between gap-3 md:flex-row md:items-stretch">
      <SearchInput
        onChange={handleSearchChange}
        onErase={handleSearchErase}
        placeholder="search tournaments..."
        className="max-w-3xl"
      />
      <div className="flex gap-3 justify-self-end">
        <Listbox
          className="rounded-full"
          onChange={handleSortByChange}
          options={sortOptions}
          value={sortBy}
        />
      </div>
    </div>
  );
};

export default TournamentFilters;
