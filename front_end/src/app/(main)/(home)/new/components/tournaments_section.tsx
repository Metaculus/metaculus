import { getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import TournamentCard from "@/components/tournament_card";
import Button from "@/components/ui/button";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { TournamentType } from "@/types/projects";
import cn from "@/utils/core/cn";
import { getProjectLink } from "@/utils/navigation";

const TournamentsSection: FC<{ className?: string }> = async ({
  className,
}) => {
  const t = await getTranslations();
  const allTournaments = (await ServerProjectsApi.getTournaments()).filter(
    (t) => t.is_ongoing
  );
  const tournaments = allTournaments.filter((t) => t.show_on_homepage);

  return (
    <section className={cn(className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1 text-gray-1000 dark:text-gray-1000-dark">
          <h2 className="m-0 text-xl font-bold leading-7">
            {t("forecasting")} {t("tournaments")}
          </h2>
          <p className="m-0 max-w-[420px] text-base font-normal leading-6">
            {t("joinTournaments")}
          </p>
        </div>
        <Button
          href="/tournaments/"
          variant="secondary"
          size="md"
          className="whitespace-nowrap font-normal"
        >
          {t("exploreNTournaments", { count: allTournaments.length })} →
        </Button>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {tournaments.map((tournament) => (
          <TournamentCard
            key={tournament.id}
            href={getProjectLink(tournament)}
            headerImageSrc={tournament.header_image}
            name={tournament.name}
            questionsCount={tournament.questions_count}
            closeDate={tournament.close_date}
            showCloseDate={tournament.type !== TournamentType.QuestionSeries}
            prizePool={tournament.prize_pool}
            withCount={true}
            isPrivate={tournament.default_permission === null}
          />
        ))}
      </div>
    </section>
  );
};

export default WithServerComponentErrorBoundary(TournamentsSection);
