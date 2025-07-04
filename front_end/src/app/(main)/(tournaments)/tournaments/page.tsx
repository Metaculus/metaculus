import { differenceInMilliseconds } from "date-fns";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentPreview, TournamentType } from "@/types/projects";
import { getPublicSettings } from "@/utils/public_settings.server";

import TournamentFilters from "./components/tournament_filters";
import TournamentsList from "./components/tournaments_list";

export const metadata = {
  title: "Tournaments | Metaculus",
  description:
    "Help the global community tackle complex challenges in Metaculus Tournaments. Prove your forecasting abilities, support impactful policy decisions, and compete for cash prizes.",
};

export default async function Tournaments() {
  const t = await getTranslations();

  const tournaments = await ServerProjectsApi.getTournaments();
  const { activeTournaments, archivedTournaments, questionSeries, indexes } =
    extractTournamentLists(tournaments);

  const { PUBLIC_MINIMAL_UI } = getPublicSettings();

  return (
    <main className="mx-auto mb-24 mt-16 w-full max-w-7xl flex-1 px-4 text-blue-700 dark:text-blue-700-dark sm:mt-28 sm:px-8 md:px-12 lg:px-16">
      {!PUBLIC_MINIMAL_UI && (
        <div>
          <h1 className="mb-12 mt-0 text-4xl sm:text-5xl">
            {t("tournaments")}
          </h1>
          <p className="my-4 text-lg">{t("tournamentsHero1")}</p>
          <p className="my-4 text-lg">{t("tournamentsHero2")}</p>
          <p className="my-4 text-lg">
            {t.rich("tournamentsHero3", {
              scores: (chunks) => (
                <Link href="/help/scores-faq/#tournament-scores">{chunks}</Link>
              ),
            })}
          </p>
          <p className="my-4 text-lg">
            {t.rich("tournamentsHero4", {
              email: (chunks) => (
                <a href="mailto:hello@metaculus.com">{chunks}</a>
              ),
            })}
          </p>
        </div>
      )}

      <TournamentFilters />

      <hr className="hidden border-gray-300 dark:border-gray-300-dark md:block" />

      <TournamentsList
        title={t("ActiveTournaments")}
        items={activeTournaments}
        cardsPerPage={12}
        withEmptyState
      />

      <TournamentsList
        title={t("QuestionSeries")}
        items={questionSeries}
        cardsPerPage={12}
      />

      {indexes.length > 0 && (
        <TournamentsList
          title={t("Indexes")}
          items={indexes}
          cardsPerPage={12}
          withEmptyState
        />
      )}

      <TournamentsList
        title={t("Archive")}
        items={archivedTournaments}
        cardsPerPage={12}
        initialCardsCount={4}
      />
    </main>
  );
}

function extractTournamentLists(tournaments: TournamentPreview[]) {
  const activeTournaments: TournamentPreview[] = [];
  const archivedTournaments: TournamentPreview[] = [];
  const questionSeries: TournamentPreview[] = [];
  const indexes: TournamentPreview[] = [];

  const sortedTournaments = [...tournaments].sort((a, b) =>
    differenceInMilliseconds(new Date(b.start_date), new Date(a.start_date))
  );

  for (const tournament of sortedTournaments) {
    if (tournament.is_ongoing) {
      if (tournament.type === TournamentType.QuestionSeries) {
        questionSeries.push(tournament);
      } else if (tournament.type === TournamentType.Index) {
        indexes.push(tournament);
      } else {
        activeTournaments.push(tournament);
      }
    } else {
      archivedTournaments.push(tournament);
    }
  }

  return { activeTournaments, archivedTournaments, questionSeries, indexes };
}
