"use client";

import React from "react";

import TournamentsGrid from "./tournaments_grid";
import { useTournamentsSection } from "../tournaments_provider";

const SeriesTournamentsGrid: React.FC = () => {
  const { items } = useTournamentsSection();

  return (
    <div>
      <div className="text-lg">
        Question Series Tournaments ({items.length})
      </div>
      <TournamentsGrid items={items} />
    </div>
  );
};

export default SeriesTournamentsGrid;
