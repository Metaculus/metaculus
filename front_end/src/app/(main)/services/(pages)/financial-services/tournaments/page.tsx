import { getTranslations } from "next-intl/server";

import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentPreview } from "@/types/projects";

import {
  description,
  metadata,
  spotlightTournamentDescription,
  steps,
  stepsDescription,
} from "./config";
import TournamentsPageTemplate from "../../../components/templates/tournaments_page_template";
import {
  isSpotlightTournament,
  sortServiceTournaments,
} from "../../../helpers";
import ServiceConfig from "../../../serviceConfig";

export { metadata };

export default async function FinancialServicesTournamentsPage() {
  const t = await getTranslations();
  const { spotlightTournamentId } = ServiceConfig;

  const tournaments = await ServerProjectsApi.getTournaments({
    show_on_services_page: true,
  });

  const { spotlightTournament, filteredTournaments } = tournaments.reduce(
    (acc, tournament) => {
      if (isSpotlightTournament(tournament, spotlightTournamentId)) {
        acc.spotlightTournament = tournament;
      } else {
        acc.filteredTournaments.push(tournament);
      }
      return acc;
    },
    {
      spotlightTournament: undefined as TournamentPreview | undefined,
      filteredTournaments: [] as TournamentPreview[],
    }
  );

  const sortedTournaments = sortServiceTournaments(filteredTournaments);

  return (
    <TournamentsPageTemplate
      spotlightTournament={spotlightTournament}
      spotlightTournamentDescription={spotlightTournamentDescription}
      tournaments={sortedTournaments}
      launchTournament={t.rich("launchTournamentOnMetaculus", {
        span: (chunks) => (
          <span className="text-blue-700 dark:text-blue-700-dark">
            {chunks}
          </span>
        ),
      })}
      description={{
        firstPart: description.firstPart,
        secondPart: description.secondPart,
      }}
      stepsDescription={stepsDescription}
      steps={steps}
    />
  );
}
