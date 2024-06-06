import { isAfter, isBefore } from "date-fns";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import TournamentsList from "@/app/tournaments/components/tournaments_list";
import ProjectsApi from "@/services/projects";
import { Tournament, TournamentType } from "@/types/projects";

export default async function Tournaments() {
  const t = await getTranslations();

  const tournaments = await ProjectsApi.getTournaments();
  const { activeTournaments, archivedTournaments, questionSeries } =
    extractTournamentLists(tournaments);

  return (
    <main className="mx-auto mb-24 mt-16 w-full max-w-7xl flex-1 px-4 text-metac-blue-700 dark:text-metac-blue-700-dark sm:mt-28 sm:px-8 md:px-12 lg:px-16">
      <div>
        <h1 className="mb-12 mt-0 text-4xl sm:text-5xl">
          {t("tournamentsTitle")}
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
      <hr className="hidden border-metac-gray-300 dark:border-metac-gray-300-dark md:block" />

      <TournamentsList
        title={t("ActiveTournaments")}
        items={activeTournaments}
      />

      <TournamentsList
        title={t("QuestionSeries")}
        items={questionSeries}
        withDate={false}
      />

      <TournamentsList title={t("Archive")} items={archivedTournaments} />
    </main>
  );
}

function extractTournamentLists(tournaments: Tournament[]) {
  const now = new Date();

  const activeTournaments: Tournament[] = [];
  const archivedTournaments: Tournament[] = [];
  const questionSeries: Tournament[] = [];

  for (const tournament of tournaments) {
    if (!tournament.questions_count) {
      continue;
    }

    const closeDate = new Date(tournament.close_date);

    if (
      tournament.type === TournamentType.QuestionSeries &&
      isBefore(now, closeDate)
    ) {
      questionSeries.push(tournament);
      continue;
    }

    if (tournament.is_ongoing && isBefore(now, closeDate)) {
      activeTournaments.push(tournament);
      continue;
    }

    if (!tournament.is_ongoing && isAfter(now, closeDate)) {
      archivedTournaments.push(tournament);
    }
  }

  return { activeTournaments, archivedTournaments, questionSeries };
}
