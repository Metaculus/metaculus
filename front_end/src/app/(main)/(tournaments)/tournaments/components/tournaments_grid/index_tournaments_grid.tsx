"use client";

import React from "react";

import TournamentsGrid from "./tournaments_grid";
import { useTournamentsSection } from "../tournaments_provider";
import IndexTournamentCard from "./index_tournament_card";

const IndexTournamentsGrid: React.FC = () => {
  const { items } = useTournamentsSection();

  return (
    <TournamentsGrid
      items={items}
      renderItem={(item) => <IndexTournamentCard key={item.id} item={item} />}
      className="grid-cols-1 md:grid-cols-3 xl:grid-cols-3"
    />
  );
};

export default IndexTournamentsGrid;
