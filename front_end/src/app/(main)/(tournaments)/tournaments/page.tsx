import ServerProjectsApi from "@/services/api/projects/projects.server";

import LiveTournamentsGrid from "./components/new/tournaments_grid/live_tournaments_grid";
import TournamentsScreen from "./components/new/tournaments_screen";
import OldTournamentsScreen from "./components/old/old_tournaments_screen";
import { extractTournamentLists } from "./helpers";

export const metadata = {
  title: "Tournaments | Metaculus",
  description:
    "Help the global community tackle complex challenges in Metaculus Tournaments. Prove your forecasting abilities, support impactful policy decisions, and compete for cash prizes.",
};

const isOldScreen = false;

const LiveTournamentsPage: React.FC = async () => {
  const tournaments = await ServerProjectsApi.getTournaments();
  const { activeTournaments, archivedTournaments, questionSeries, indexes } =
    extractTournamentLists(tournaments);

  if (isOldScreen) {
    return (
      <OldTournamentsScreen
        activeTournaments={activeTournaments}
        archivedTournaments={archivedTournaments}
        questionSeries={questionSeries}
        indexes={indexes}
      />
    );
  }

  return (
    <TournamentsScreen current="live" tournaments={tournaments}>
      <LiveTournamentsGrid />
    </TournamentsScreen>
  );
};

export default LiveTournamentsPage;
