"use client";
import { TournamentPreview } from "@/types/projects";

import TournamentsGrid from "./tournaments_grid";
import { selectTournamentsForSection } from "../../../helpers";

type Props = {
  tournaments: TournamentPreview[];
};

const ArchivedTournamentsGrid: React.FC<Props> = ({ tournaments }) => {
  const list = selectTournamentsForSection(tournaments, "archived");
  return (
    <TournamentsGrid
      items={list}
      render={(filtered) => (
        <div className="text-lg">Archived Tournaments ({filtered.length})</div>
      )}
    />
  );
};

export default ArchivedTournamentsGrid;
