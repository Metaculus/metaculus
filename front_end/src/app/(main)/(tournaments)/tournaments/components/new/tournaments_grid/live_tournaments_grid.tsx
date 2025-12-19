"use client";

import React from "react";

import TournamentsGrid from "./tournaments_grid";
import { useTournamentsSection } from "../tournaments_provider";

const LiveTournamentsGrid: React.FC = () => {
  const { items } = useTournamentsSection();

  return (
    <div>
      <div className="text-lg">Live Tournaments ({items.length})</div>
      <TournamentsGrid items={items} />
    </div>
  );
};

export default LiveTournamentsGrid;
