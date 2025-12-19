import ServerProjectsApi from "@/services/api/projects/projects.server";

import ArchivedTournamentsGrid from "../components/new/tournaments_grid/archived_tournaments_grid";
import TournamentsScreen from "../components/new/tournaments_screen";

const ArchivedPage: React.FC = async () => {
  const tournaments = await ServerProjectsApi.getTournaments();
  return (
    <TournamentsScreen current="archived" tournaments={tournaments}>
      <ArchivedTournamentsGrid />
    </TournamentsScreen>
  );
};

export default ArchivedPage;
