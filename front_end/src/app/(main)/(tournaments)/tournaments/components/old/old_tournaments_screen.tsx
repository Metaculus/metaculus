import Link from "next/link";
import { getTranslations } from "next-intl/server";
import React from "react";

import { TournamentPreview } from "@/types/projects";
import { getPublicSettings } from "@/utils/public_settings.server";

import TournamentFilters from "./tournament_filters";
import TournamentsList from "./tournaments_list";

type Props = {
  activeTournaments: TournamentPreview[];
  archivedTournaments: TournamentPreview[];
  questionSeries: TournamentPreview[];
  indexes: TournamentPreview[];
};

const OldTournamentsScreen: React.FC<Props> = async ({
  activeTournaments,
  archivedTournaments,
  questionSeries,
  indexes,
}) => {
  const t = await getTranslations();
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
        <div id="indexes-section">
          <TournamentsList
            title={t("Indexes")}
            items={indexes}
            cardsPerPage={12}
            withEmptyState
          />
        </div>
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
};

export default OldTournamentsScreen;
