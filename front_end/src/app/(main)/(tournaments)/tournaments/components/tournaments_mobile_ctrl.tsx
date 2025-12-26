"use client";

import React, { useState } from "react";

import TournamentsFilter from "./tournaments_filter";
import TournamentsInfo from "./tournaments_popover/tournaments_info";
import TournamentsInfoButton from "./tournaments_popover/tournaments_info_button";
import TournamentsSearch from "./tournaments_search";

const TournamentsMobileCtrl: React.FC = () => {
  const [isInfoOpen, setIsInfoOpen] = useState(true);

  return (
    <div className="flex flex-col gap-5 lg:hidden">
      {isInfoOpen && <TournamentsInfo onClose={() => setIsInfoOpen(false)} />}
      <div className="flex items-center gap-2">
        <TournamentsFilter />

        <div className="min-w-0 flex-1">
          <TournamentsSearch />
        </div>

        <TournamentsInfoButton
          isOpen={isInfoOpen}
          onClick={() => setIsInfoOpen((p) => !p)}
        />
      </div>
    </div>
  );
};

export default TournamentsMobileCtrl;
