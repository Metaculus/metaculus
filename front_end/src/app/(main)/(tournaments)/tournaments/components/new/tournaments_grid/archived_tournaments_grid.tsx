"use client";

import React from "react";

import TournamentsGrid from "./tournaments_grid";
import { useTournamentsSection } from "../tournaments_provider";

const ArchivedTournamentsGrid: React.FC = () => {
  const { items } = useTournamentsSection();

  return (
    <div>
      <div className="text-lg">Archived Tournaments ({items.length})</div>
      <TournamentsGrid items={items} />
    </div>
  );
};

export default ArchivedTournamentsGrid;
