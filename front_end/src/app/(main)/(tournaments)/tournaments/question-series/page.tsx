import ServerProjectsApi from "@/services/api/projects/projects.server";

import SeriesTournamentsGrid from "../components/tournaments_grid/series_tournaments_grid";
import TournamentsScreen from "../components/tournaments_screen";

const QuestionSeriesPage: React.FC = async () => {
  const tournaments = await ServerProjectsApi.getTournaments();
  const nowTs = Date.now();

  return (
    <TournamentsScreen current="series" tournaments={tournaments} nowTs={nowTs}>
      <SeriesTournamentsGrid />
    </TournamentsScreen>
  );
};

export default QuestionSeriesPage;
