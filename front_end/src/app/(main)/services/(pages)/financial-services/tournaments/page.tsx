import {
  metadata,
  launchTournament,
  description,
  stepsDescription,
  steps,
  spotlightTournament,
  spotlightTournamentDescription,
  tournaments,
} from "./config";
import TournamentsPageTemplate from "../../../components/templates/tournaments_page_template";

export { metadata };

export default function FinancialServicesTournamentsPage() {
  return (
    <TournamentsPageTemplate
      launchTournament={launchTournament}
      description={description}
      stepsDescription={stepsDescription}
      steps={steps}
      spotlightTournament={spotlightTournament}
      spotlightTournamentDescription={spotlightTournamentDescription}
      tournaments={tournaments}
    />
  );
}
