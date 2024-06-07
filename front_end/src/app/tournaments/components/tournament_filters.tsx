"use client";
import { useTranslations } from "next-intl";
import { ChangeEvent, FC, useEffect, useState } from "react";

import {
  TOURNAMENTS_SEARCH,
  TOURNAMENTS_SORT,
} from "@/app/tournaments/constants/query_params";
import SearchInput from "@/components/search_input";
import Select, { SelectOption } from "@/components/ui/select";
import useDebounce from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";
import { TournamentsSortBy } from "@/types/projects";

const TournamentFilters: FC = () => {
  const t = useTranslations();
  const { params, setParam, deleteParam, shallowNavigateToSearchParams } =
    useSearchParams();

  const [searchQuery, setSearchQuery] = useState(() => {
    const search = params.get(TOURNAMENTS_SEARCH);
    return search ? decodeURIComponent(search) : "";
  });
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  const handleSearchErase = () => {
    setSearchQuery("");
  };
  useEffect(() => {
    if (debouncedSearchQuery) {
      setParam(TOURNAMENTS_SEARCH, debouncedSearchQuery, false);
    } else {
      deleteParam(TOURNAMENTS_SEARCH, false);
    }
    shallowNavigateToSearchParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery]);

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
        value={searchQuery}
        onChange={handleSearchChange}
        onErase={handleSearchErase}
        placeholder="search tournaments..."
        className="max-w-3xl"
      />
      <div className="flex gap-3 justify-self-end">
        <Select
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
