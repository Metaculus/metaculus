"use client";

import React, { ChangeEvent, useEffect, useState } from "react";

import ExpandableSearchInput from "@/components/expandable_search_input";
import useSearchInputState from "@/hooks/use_search_input_state";

import TournamentsTabs from "./tournament_tabs";
import TournamentsFilter from "./tournaments_filter";
import TournamentsInfoPopover from "./tournaments_info_popover";
import { useTournamentsSection } from "./tournaments_provider";
import { TOURNAMENTS_SEARCH } from "../../constants/query_params";

const TournamentsHeader: React.FC = () => {
  const { current, infoOpen, toggleInfo, closeInfo } = useTournamentsSection();

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

  const showInfo = true;

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
            buttonClassName="h-9 w-9 border-[1px] [&_svg]:text-blue-700 [&_svg]:dark:text-blue-700-dark border-blue-400 dark:border-blue-400-dark"
          />

          {showInfo ? (
            <TournamentsInfoPopover
              open={infoOpen}
              onOpenChange={(next) => (next ? toggleInfo() : closeInfo())}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TournamentsHeader;
