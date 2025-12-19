import ServerProjectsApi from "@/services/api/projects/projects.server";

import SeriesTournamentsGrid from "../components/new/tournaments_grid/series_tournaments_grid";
import TournamentsScreen from "../components/new/tournaments_screen";

const QuestionSeriesPage: React.FC = async () => {
  const tournaments = await ServerProjectsApi.getTournaments();

  return (
    <TournamentsScreen current="series" tournaments={tournaments}>
      <SeriesTournamentsGrid />
    </TournamentsScreen>
  );
};

export default QuestionSeriesPage;
