"use client";
import { TournamentPreview } from "@/types/projects";

import TournamentsGrid from "./tournaments_grid";
import { selectTournamentsForSection } from "../../../helpers";

type Props = {
  tournaments: TournamentPreview[];
};

const IndexTournamentsGrid: React.FC<Props> = ({ tournaments }) => {
  const list = selectTournamentsForSection(tournaments, "indexes");

  return (
    <TournamentsGrid
      items={list}
      render={(filtered) => (
        <div className="text-lg">Indexes ({filtered.length})</div>
      )}
    />
  );
};

export default IndexTournamentsGrid;
