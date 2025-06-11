import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getTranslations } from "next-intl/server";

import { ServiceType } from "@/constants/services";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentPreview } from "@/types/projects";

import StepCard from "../components/step_card";
import ServiceConfig from "../serviceConfig";
import OtherTournaments from "./components/other_tournaments";
import TournamentSpotlight from "./components/tournament_spotlight";
import Button from "../components/button";
import GetInTouchForm from "../components/get_in_touch_form";
import { isSpotlightTournament, sortServiceTournaments } from "../helpers";

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
    <main className="mx-auto flex min-h-screen max-w-[1044px] flex-grow flex-col px-4 pt-8 sm:px-8 sm:pt-[52px] lg:px-16 lg:pt-[72px] xl:px-0 xl:pt-[132px] min-[1366px]:pt-[103px]">
      <div>
        <h3 className="m-0 mx-auto max-w-[448px] text-balance px-6 text-center text-[32px] font-bold leading-9 tracking-tight text-blue-800 dark:text-blue-800-dark sm:text-5xl md:max-w-[576px] lg:max-w-full lg:px-0">
          {t.rich("launchTournamentOnMetaculus", {
            span: (chunks) => (
              <span className="text-blue-700 dark:text-blue-700-dark">
                {chunks}
              </span>
            ),
          })}
        </h3>

        <div className="mx-auto mt-5 max-w-[880px] flex-col px-6 text-center text-sm text-blue-700 dark:text-blue-700-dark sm:px-16 sm:text-[21px] sm:leading-[32px] lg:mt-8 lg:flex lg:px-0">
          {/* Mobile paragraph */}
          <p className="m-0 text-pretty text-blue-700 dark:text-blue-700-dark lg:hidden">
            {t("metaculusHasYearsOfExperience")} {t("weHelpOrganizationsSolve")}
          </p>
          {/* Desktop paragraphs */}
          <div className="hidden lg:block">
            <p className="m-0 text-xl font-medium">
              {t("metaculusHasYearsOfExperience")}
            </p>
            <br />
            <p className="m-0 text-lg">{t("weHelpOrganizationsSolve")}</p>
          </div>
        </div>

        <Button href="#contact-us" className="mx-auto mt-8 block">
          {t("contactUs")}
        </Button>
      </div>

      <div className="mt-10 text-blue-700 dark:text-blue-700-dark sm:mt-16 lg:mt-[120px]">
        <h3 className="m-0 text-center text-3xl font-bold tracking-tight text-inherit dark:text-inherit">
          {t("howItWorks")}
        </h3>
        <p className="m-0 mt-3 text-center text-xl font-medium">
          {t("stepsForSettingUpTournament")}
        </p>
        <div className="mt-12 flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-[22px]">
          <StepCard
            step={1}
            title={t("tellUsYourGoal")}
            description={t("shareChallenge")}
            className="flex-1"
            titleClassName="lg:pr-10"
          />
          <FontAwesomeIcon
            icon={faArrowRight}
            className="hidden h-4 self-center text-blue-600 dark:text-blue-600-dark lg:block"
          />
          <StepCard
            step={2}
            title={t("weDevelopFocusedQuestions")}
            description={t("weWillDeconstruct")}
            className="flex-1"
          />
          <FontAwesomeIcon
            icon={faArrowRight}
            className="hidden h-4 self-center text-blue-600 dark:text-blue-600-dark lg:block"
          />
          <StepCard
            step={3}
            title={t("tournamentLaunches")}
            description={t("forecastsAndReasoning")}
            className="flex-1"
          />
        </div>
      </div>
      {spotlightTournament && (
        <TournamentSpotlight
          tournament={spotlightTournament}
          className="mt-10 sm:mt-16 lg:mt-[120px]"
        />
      )}

      <OtherTournaments tournaments={sortedTournaments} />

      <GetInTouchForm
        id="contact-us"
        className="mb-36 mt-10 sm:mt-12 md:mt-16 lg:mt-[120px]"
        preselectedServices={[ServiceType.RUNNING_TOURNAMENT]}
      />
    </main>
  );
}
