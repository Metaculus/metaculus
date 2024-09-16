import classNames from "classnames";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";
import invariant from "ts-invariant";

import ProjectContributions from "@/app/(main)/(leaderboards)/contributions/components/project_contributions";
import ProjectLeaderboard from "@/app/(main)/(leaderboards)/leaderboard/components/project_leaderboard";
import TournamentControls from "@/app/(main)/(tournaments)/tournament/components/tournament_controls";
import TournamentSubscribeButton from "@/app/(main)/(tournaments)/tournament/components/tournament_subscribe_button";
import HtmlContent from "@/components/html_content";
import TournamentFilters from "@/components/tournament_filters";
import Button from "@/components/ui/button";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { ProjectPermissions } from "@/types/post";
import { TournamentType } from "@/types/projects";
import { formatDate } from "@/utils/date_formatters";

import TournamentFeed from "../components/tournament_feed";

const LazyProjectMembers = dynamic(() => import("../components/members"), {
  ssr: false,
});

export default async function TournamentSlug({
  params,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const tournament = await ProjectsApi.getSlugTournament(params.slug);
  invariant(tournament, `Tournament not found: ${params.slug}`);

  const currentUser = await ProfileApi.getMyProfile();

  const [categories, tags] = await Promise.all([
    ProjectsApi.getCategories(),
    ProjectsApi.getTags(),
  ]);

  const t = await getTranslations();
  const locale = await getLocale();
  const isQuestionSeries = tournament.type === TournamentType.QuestionSeries;
  const title = isQuestionSeries ? t("QuestionSeries") : t("Tournament");
  const questionsTitle = isQuestionSeries
    ? t("SeriesContents")
    : t("questions");

  return (
    <main className="mx-auto mb-16 mt-4 min-h-min w-full max-w-[780px] flex-auto px-0">
      <div className="bg-gray-0 dark:bg-gray-0-dark">
        <div
          className={classNames(
            " flex flex-wrap items-center justify-between gap-2.5 rounded-t px-3 py-1.5 text-[20px] uppercase text-gray-100 dark:text-gray-100-dark",
            tournament.type === TournamentType.QuestionSeries
              ? "bg-gray-500 dark:bg-gray-500-dark"
              : "bg-blue-600 dark:bg-blue-600-dark"
          )}
        >
          <Link
            href={"/tournaments"}
            className="no-underline hover:text-gray-400 dark:hover:text-gray-400-dark"
          >
            {title}
          </Link>
          {currentUser?.is_superuser && (
            <TournamentControls tournament={tournament} />
          )}
        </div>
        {!!tournament.header_image && (
          <div className="relative h-[130px] w-full">
            <Image
              src={tournament.header_image}
              alt=""
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 780px"
              className="size-full object-cover object-center"
              quality={100}
            />
          </div>
        )}
        <div className="bg-gray-0 px-3 pb-4 dark:bg-gray-0-dark">
          <div className="pb-2">
            <h1>{tournament.name}</h1>
          </div>
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-wrap gap-9 py-4">
              {tournament.prize_pool !== null && (
                <TournamentStat
                  title={t("prizePool")}
                  text={"$" + Number(tournament.prize_pool).toLocaleString()}
                />
              )}
              <TournamentStat
                title={t("StartDate")}
                text={formatDate(locale, new Date(tournament.start_date))}
              />
              <TournamentStat
                title={t("EndDate")}
                text={formatDate(locale, new Date(tournament.close_date))}
              />
              <TournamentStat
                title={t("questions")}
                text={tournament.posts_count.toString()}
              />
            </div>
            <div>
              <TournamentSubscribeButton
                user={currentUser}
                tournament={tournament}
              />
            </div>
          </div>
          <HtmlContent content={tournament.description} />

          <ProjectLeaderboard
            projectId={tournament.id}
            userId={currentUser?.id}
            prizePool={tournament.prize_pool}
            isQuestionSeries={isQuestionSeries}
          />
          {currentUser && (
            <ProjectContributions
              project={tournament}
              userId={currentUser.id}
            />
          )}
        </div>

        {[ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(
          tournament.user_permission
        ) && (
          <section className="mx-2 border-t border-t-[#e5e7eb] px-1 py-4">
            <div className="flex w-full justify-center">
              <Button href={`/questions/create?tournament=${tournament.id}`}>
                + {t("question")}
              </Button>
            </div>
          </section>
        )}
        <section className="mx-2 border-t border-t-[#e5e7eb] px-1 py-4">
          <h2 className="mb-5">{questionsTitle}</h2>
          <TournamentFilters categories={categories} tags={tags} />
          <TournamentFeed slug={params.slug} />
        </section>
      </div>
      {[ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(
        tournament.user_permission
      ) && <LazyProjectMembers project={tournament} />}
    </main>
  );
}

const TournamentStat: FC<{ title: string; text: string }> = ({
  text,
  title,
}) => (
  <div className="flex flex-col">
    <span className="font-semibold capitalize leading-5">{title}</span>
    <span className="text-xl font-bold leading-6">{text}</span>
  </div>
);
