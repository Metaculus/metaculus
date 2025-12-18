"use client";
import React from "react";

import { TournamentPreview } from "@/types/projects";

import TournamentsGrid from "./tournaments_grid";
import { selectTournamentsForSection } from "../../../helpers";

type Props = {
  tournaments: TournamentPreview[];
};

const LiveTournamentsGrid: React.FC<Props> = ({ tournaments }) => {
  const list = selectTournamentsForSection(tournaments, "live");
  return (
    <TournamentsGrid
      items={list}
      render={(filtered) => (
        <div className="text-lg">Live Tournaments ({filtered.length})</div>
      )}
    />
  );
};

export default LiveTournamentsGrid;
