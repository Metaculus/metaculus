import { getTranslations } from "next-intl/server";

import serverMiscApi from "@/services/api/misc/misc.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { abbreviatedNumber } from "@/utils/formatters/number";

import { CASE_STUDIES } from "./components/case_studies/constants";
import ServicesPageTemplate from "./components/templates/services_page_template";
import { sortServiceTournaments } from "./helpers";
import ServiceConfig from "./serviceConfig";

export const metadata = {
  title: "Partner with Metaculus",
  description:
    "Discover how your organization can collaborate with Metaculus to improve strategic decision-making through forecasting. Explore our solutions for quantifying risk, identifying top talent, and enabling internal forecasting.",
};

export default async function ServicesPage() {
  const t = await getTranslations();
  const { mainPageTournamentsList } = ServiceConfig;
  const [tournaments, siteStats] = await Promise.all([
    ServerProjectsApi.getTournaments({
      show_on_services_page: true,
    }),
    serverMiscApi.getSiteStats(),
  ]);
  const mainPageTournaments = tournaments.filter((tournament) =>
    mainPageTournamentsList.find(
      ({ id }) => String(id) === tournament.slug || id === tournament.id
    )
  );
  const sortedTournaments = sortServiceTournaments(mainPageTournaments);
  const statsList = [
    {
      label: t("predictions"),
      value: `${abbreviatedNumber(siteStats.predictions)}+`,
    },
    {
      label: t("forecastingQuestions"),
      value: `${abbreviatedNumber(siteStats.questions)}+`,
    },
    {
      label: t("questionsResolved"),
      value: `${abbreviatedNumber(siteStats.resolved_questions)}+`,
    },
    {
      label: `${t("years")} ${t("ofPredictions")}`,
      value: `${siteStats.years_of_predictions}`,
    },
  ];

  return (
    <ServicesPageTemplate
      heading={{
        statsList,
        overview: t("weHelpOrganizationsMakeBetterDecisions"),
      }}
      solutions={{
        title: t("solutions"),
        description: t("learnAboutPotentialWays"),
      }}
      tournaments={{
        title: t("launchTournament"),
        description: t("launchTournamentDescription"),
        data: sortedTournaments,
      }}
      caseStudies={{
        title: t("caseStudiesTitle"),
        description: t("caseStudiesDescription"),
        cards: CASE_STUDIES,
      }}
      privateInstances={{
        title: t("privateInstances"),
        description: t("deployMetaculusPlatform"),
      }}
      proForecasters={{
        title: t("proForecasters"),
        firstPart: t("engageProForecasters"),
        secondPart: t("ourMostAccurateForecasters"),
      }}
    />
  );
}
