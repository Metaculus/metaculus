import { isValid } from "date-fns";
import { toDate } from "date-fns-tz";
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
        disableClientSort
      />
    </main>
  );
}

const archiveEndTs = (t: TournamentPreview) =>
  [t.forecasting_end_date, t.close_date, t.start_date]
    .map((s) => (s ? toDate(s.trim(), { timeZone: "UTC" }) : null))
    .find((d) => d && isValid(d))
    ?.getTime() ?? 0;

function extractTournamentLists(tournaments: TournamentPreview[]) {
  const activeTournaments: TournamentPreview[] = [];
  const archivedTournaments: TournamentPreview[] = [];
  const questionSeries: TournamentPreview[] = [];
  const indexes: TournamentPreview[] = [];

  for (const t of tournaments) {
    if (t.is_ongoing) {
      if (t.type === TournamentType.QuestionSeries) {
        questionSeries.push(t);
      } else if (t.type === TournamentType.Index) {
        indexes.push(t);
      } else {
        activeTournaments.push(t);
      }
    } else {
      archivedTournaments.push(t);
    }
  }

  archivedTournaments.sort((a, b) => archiveEndTs(b) - archiveEndTs(a));
  return { activeTournaments, archivedTournaments, questionSeries, indexes };
}
