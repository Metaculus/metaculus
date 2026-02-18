import ServerProjectsApi from "@/services/api/projects/projects.server";

import LiveTournamentsGrid from "./components/tournaments_grid/live_tournaments_grid";
import TournamentsScreen from "./components/tournaments_screen";

export const metadata = {
  title: "Tournaments | Metaculus",
  description:
    "Help the global community tackle complex challenges in Metaculus Tournaments. Prove your forecasting abilities, support impactful policy decisions, and compete for cash prizes.",
};

const LiveTournamentsPage: React.FC = async () => {
  const tournaments = await ServerProjectsApi.getTournaments();
  const nowTs = Date.now();

  return (
    <TournamentsScreen current="live" tournaments={tournaments} nowTs={nowTs}>
      <LiveTournamentsGrid />
    </TournamentsScreen>
  );
};

export default LiveTournamentsPage;
