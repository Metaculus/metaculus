import ServerProjectsApi from "@/services/api/projects/projects.server";

import IndexTournamentsGrid from "../components/new/tournaments_grid/index_tournaments_grid";
import TournamentsScreen from "../components/new/tournaments_screen";

const IndexesPage: React.FC = async () => {
  const tournaments = await ServerProjectsApi.getTournaments();

  return (
    <TournamentsScreen current="indexes" tournaments={tournaments}>
      <IndexTournamentsGrid />
    </TournamentsScreen>
  );
};

export default IndexesPage;
