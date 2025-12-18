"use client";
import { TournamentPreview } from "@/types/projects";

import TournamentsGrid from "./tournaments_grid";
import { selectTournamentsForSection } from "../../../helpers";

type Props = {
  tournaments: TournamentPreview[];
};

const SeriesTournamentsGrid: React.FC<Props> = ({ tournaments }) => {
  const items = selectTournamentsForSection(tournaments, "series");
  return (
    <TournamentsGrid
      items={items}
      render={(filtered) => (
        <div className="text-lg">
          Question Series Tournaments ({filtered.length})
        </div>
      )}
    />
  );
};

export default SeriesTournamentsGrid;
