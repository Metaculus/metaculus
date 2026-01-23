"use client";

import React, { useEffect, useState } from "react";

import TournamentsFilter from "./tournaments_filter";
import TournamentsInfo from "./tournaments_popover/tournaments_info";
import TournamentsInfoButton from "./tournaments_popover/tournaments_info_button";
import { useTournamentsSection } from "./tournaments_provider";
import TournamentsSearch from "./tournaments_search";
import { useTournamentsInfoDismissed } from "../hooks/use_tournaments_info_dismissed";

const TournamentsMobileCtrl: React.FC = () => {
  const { current } = useTournamentsSection();
  const { dismissed, dismiss, ready } = useTournamentsInfoDismissed();
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const showInfo = current === "live";

  useEffect(() => {
    if (!ready) return;
    setIsInfoOpen(showInfo && !dismissed);
  }, [ready, dismissed, showInfo]);

  return (
    <div className="flex flex-col gap-5 lg:hidden">
      {showInfo && isInfoOpen && (
        <TournamentsInfo
          onClose={() => {
            dismiss();
            setIsInfoOpen(false);
          }}
        />
      )}
      <div className="flex items-center gap-2">
        <TournamentsFilter />

        <div className="min-w-0 flex-1">
          <TournamentsSearch />
        </div>

        {showInfo && (
          <TournamentsInfoButton
            isOpen={isInfoOpen}
            onClick={() => {
              dismiss();
              setIsInfoOpen((p) => !p);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TournamentsMobileCtrl;
