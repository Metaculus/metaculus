"use client";

import React from "react";

import TournamentsGrid from "./tournaments_grid";
import { useTournamentsSection } from "../tournaments_provider";
import LiveTournamentCard from "./live_tournament_card";

const LiveTournamentsGrid: React.FC = () => {
  const { items, nowTs } = useTournamentsSection();

  return (
    <TournamentsGrid
      items={items}
      renderItem={(item) => (
        <LiveTournamentCard key={item.id} item={item} nowTs={nowTs} />
      )}
    />
  );
};

export default LiveTournamentsGrid;
