import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FC } from "react";

import TournamentCard from "@/components/tournament_card";
import ServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ProjectsApi from "@/services/projects";
import { Tournament, TournamentType } from "@/types/projects";

type Props = {
  postSlugs: string[];
};

const TournamentsBlock: FC<Props> = async ({ postSlugs }) => {
  return ServerComponentErrorBoundary(async () => {
    const t = await getTranslations();
    const tournamentPromises = postSlugs.map(
      (slug) => ProjectsApi.getSlugTournament(slug) as Promise<Tournament>
    );
    const tournaments = await Promise.all(tournamentPromises);

    return (
      <div className="my-6 flex flex-col md:my-12 lg:my-16">
        <h2 className="mb-5 mt-0 w-full text-4xl font-bold text-blue-800 dark:text-blue-800-dark md:text-5xl">
          {t("forecasting")}{" "}
          <span className="text-blue-600 dark:text-blue-600-dark">
            {t("tournaments")}
          </span>
        </h2>
        <p className="m-0 text-xl text-blue-700 dark:text-blue-700-dark">
          {t("joinTournaments")}
        </p>
        <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              href={
                tournament.slug
                  ? `/tournament/${tournament.slug}`
                  : `/tournament/${tournament.id}`
              }
              headerImageSrc={tournament.header_image}
              name={tournament.name}
              questionsCount={tournament.posts_count}
              closeDate={tournament.close_date}
              showCloseDate={tournament.type !== TournamentType.QuestionSeries}
              prizePool={tournament.prize_pool}
              withCount={false}
            />
          ))}
        </div>
        <Link
          href="/tournaments/"
          className="mt-8 inline-flex items-center self-end text-right text-base font-bold text-blue-800 no-underline dark:text-blue-800-dark"
        >
          {t("seeAllTournaments")}
          <FontAwesomeIcon icon={faArrowRight} className="ml-1.5 mr-1" />
        </Link>
      </div>
    );
  });
};

export default TournamentsBlock;
