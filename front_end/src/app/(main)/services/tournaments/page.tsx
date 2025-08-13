import { getTranslations } from "next-intl/server";

import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentPreview } from "@/types/projects";

import TournamentsPageTemplate from "../components/templates/tournaments_page_template";
import { isSpotlightTournament, sortServiceTournaments } from "../helpers";
import ServiceConfig from "../serviceConfig";

export const metadata = {
  title: "Run a Forecasting Tournament with Metaculus",
  description:
    "Design and run forecasting tournaments to crowdsource insights on your critical questions. Metaculus helps you surface expert predictions and solve complex challenges with structured, competitive forecasting.",
};

export default async function TournamentsPage() {
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
      spotlightTournamentDescription={t("tournamentSpotlightDescription")}
      tournaments={sortedTournaments}
      launchTournament={t.rich("launchTournamentOnMetaculus", {
        span: (chunks) => (
          <span className="text-blue-700 dark:text-blue-700-dark">
            {chunks}
          </span>
        ),
      })}
      description={{
        firstPart: t("metaculusHasYearsOfExperience"),
        secondPart: t("weHelpOrganizationsSolve"),
      }}
      stepsDescription={t("stepsForSettingUpTournament")}
      steps={[
        {
          title: t("tellUsYourGoal"),
          description: t("shareChallenge"),
          titleClassName: "lg:pr-10",
        },
        {
          title: t("weDevelopFocusedQuestions"),
          description: t("weWillDeconstruct"),
        },
        {
          title: t("tournamentLaunches"),
          description: t("forecastsAndReasoning"),
        },
      ]}
    />
  );
}
