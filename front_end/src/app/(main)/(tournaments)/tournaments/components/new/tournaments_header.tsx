"use client";

import React, { ChangeEvent, useEffect, useState } from "react";

import ExpandableSearchInput from "@/components/expandable_search_input";
import useSearchInputState from "@/hooks/use_search_input_state";

import TournamentsTabs from "./tournament_tabs";
import TournamentsFilter from "./tournaments_filter";
import TournamentsHero from "./tournaments_hero";
import { useTournamentsSection } from "./tournaments_provider";
import { TOURNAMENTS_SEARCH } from "../../constants/query_params";

const TournamentsHeader: React.FC = () => {
  const { current } = useTournamentsSection();

  const [searchQuery, setSearchQuery] = useSearchInputState(
    TOURNAMENTS_SEARCH,
    {
      mode: "client",
      debounceTime: 300,
      modifySearchParams: true,
    }
  );

  const [draftQuery, setDraftQuery] = useState(searchQuery);

  useEffect(() => setDraftQuery(searchQuery), [searchQuery]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value;
    setDraftQuery(next);
    setSearchQuery(next);
  };

  const handleSearchErase = () => {
    setDraftQuery("");
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <TournamentsTabs current={current} />
        <div className="flex items-center gap-3">
          <TournamentsFilter />
          <ExpandableSearchInput
            value={draftQuery}
            onChange={handleSearchChange}
            onErase={handleSearchErase}
            placeholder="search..."
            expandedWidthClassName="w-[176px]"
          />
        </div>
      </div>

      <TournamentsHero />
    </div>
  );
};

export default TournamentsHeader;
