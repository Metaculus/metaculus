"use client";
import { ChangeEvent, FC } from "react";

import SearchInput from "@/components/search_input";
import useSearchInputState from "@/hooks/use_search_input_state";

import { TOURNAMENTS_SEARCH } from "../../constants/query_params";
import TournamentsFilter from "../new/tournaments_filter";

const TournamentFilters: FC = () => {
  const [searchQuery, setSearchQuery] = useSearchInputState(
    TOURNAMENTS_SEARCH,
    { mode: "client", debounceTime: 300, modifySearchParams: true }
  );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  const handleSearchErase = () => {
    setSearchQuery("");
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
        <TournamentsFilter />
      </div>
    </div>
  );
};

export default TournamentFilters;
