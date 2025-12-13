import { faArrowLeft, faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import TournamentCard from "@/components/tournament_card";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentType } from "@/types/projects";

export const metadata = {
  title: "MiniBench | AI Forecasting Benchmark | Metaculus",
  description:
    "Explore MiniBench, Metaculus' bi-weekly experimental bot tournament series. Fast-paced forecasting competitions for AI bots with rapid iteration and feedback.",
};

export default async function MiniBenchPage() {
  const t = await getTranslations();

  const sortedTournaments = await ServerProjectsApi.getMinibenchTournaments();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-200 to-blue-100 dark:from-blue-200-dark dark:to-blue-300-dark">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-8 md:px-12">
        <div className="mb-10 flex flex-col items-center text-center">
          <h1 className="mb-4 text-4xl font-bold text-blue-800 dark:text-blue-800-dark sm:text-5xl">
            MiniBench
          </h1>

          <p className="max-w-2xl text-lg text-blue-700 dark:text-blue-700-dark">
            {t("minibenchDescription")}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/aib"
              className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-medium text-blue-700 no-underline transition-all hover:bg-blue-50 dark:bg-blue-100-dark dark:text-blue-700-dark dark:hover:bg-blue-200-dark"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              {t("minibenchBackToAIB")}
            </Link>
            <Link
              href="/notebooks/38928/ai-benchmark-resources/"
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-2.5 text-sm font-medium text-white no-underline transition-all hover:bg-blue-800 dark:bg-blue-700-dark dark:hover:bg-blue-600-dark"
            >
              <FontAwesomeIcon icon={faInfoCircle} />
              {t("minibenchResources")}
            </Link>
          </div>
        </div>

        <div className="mb-10 rounded-lg bg-white p-6 dark:bg-blue-100-dark">
          <h2 className="m-0 mb-4 text-xl font-bold text-blue-800 dark:text-blue-800-dark sm:text-2xl">
            {t("minibenchAboutTitle")}
          </h2>
          <div className="space-y-3 text-blue-700 dark:text-blue-700-dark">
            <p className="m-0 leading-relaxed">{t("minibenchAboutP1")}</p>
            <p className="m-0 leading-relaxed">{t("minibenchAboutP2")}</p>
          </div>
        </div>

        {sortedTournaments.length > 0 ? (
          <section>
            <h2 className="mb-6 text-xl font-bold text-blue-800 dark:text-blue-800-dark sm:text-2xl">
              {t("aibTournamentsHeading")}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sortedTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  href={
                    tournament.slug
                      ? `/tournament/${tournament.slug}`
                      : `/tournament/${tournament.id}`
                  }
                  headerImageSrc={tournament.header_image}
                  name={tournament.name}
                  questionsCount={tournament.questions_count}
                  closeDate={
                    tournament.forecasting_end_date || tournament.close_date
                  }
                  showCloseDate={
                    tournament.type !== TournamentType.QuestionSeries
                  }
                  prizePool={tournament.prize_pool}
                  isPrivate={tournament.default_permission === null}
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center dark:bg-blue-100-dark">
            <p className="text-blue-700 dark:text-blue-700-dark">
              {t("minibenchNoTournaments")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
