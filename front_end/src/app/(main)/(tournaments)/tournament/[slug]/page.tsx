import { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";
import invariant from "ts-invariant";

import ProjectContributions from "@/app/(main)/(leaderboards)/contributions/components/project_contributions";
import ProjectLeaderboard from "@/app/(main)/(leaderboards)/leaderboard/components/project_leaderboard";
import TournamentSubscribeButton from "@/app/(main)/(tournaments)/tournament/components/tournament_subscribe_button";
import HtmlContent from "@/components/html_content";
import TournamentFilters from "@/components/tournament_filters";
import Button from "@/components/ui/button";
import { defaultDescription } from "@/constants/metadata";
import ProfileApi from "@/services/profile";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { ProjectPermissions } from "@/types/post";
import { ProjectVisibility, TournamentType } from "@/types/projects";
import cn from "@/utils/cn";
import { formatDate } from "@/utils/date_formatters";

import TournamentDropdownMenu from "../components/dropdown_menu";
import TournamentFeed from "../components/tournament_feed";

const LazyProjectMembers = dynamic(() => import("../components/members"), {
  ssr: false,
});

type Props = { params: { slug: string }; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tournament = await ProjectsApi.getTournament(params.slug);

  if (!tournament) {
    return {};
  }
  const parsedDescription = tournament.description
    .replace(/<[^>]*>/g, "")
    .split("\n")[0];

  return {
    title: tournament.name,
    description: !!parsedDescription ? parsedDescription : defaultDescription,
    // Hide unlisted pages from search engines
    ...(tournament.visibility === ProjectVisibility.Unlisted
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

const minimalUI = (process.env.MINIMAL_UI ?? "false") === "true";

export default async function TournamentSlug({ params }: Props) {
  const tournament = await ProjectsApi.getTournament(params.slug);
  invariant(tournament, `Tournament not found: ${params.slug}`);

  const currentUser = await ProfileApi.getMyProfile();

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
          className={cn(
            "flex flex-wrap items-center justify-between gap-2.5 rounded-t px-3 py-1.5 text-[20px] uppercase text-gray-100 dark:text-gray-100-dark",
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
          <TournamentDropdownMenu tournament={tournament} />
        </div>
        {!!tournament.header_image && (
          <div className="relative h-[130px] w-full">
            <Image
              src={tournament.header_image}
              alt=""
              fill
              priority
              className="size-full object-cover object-center"
              unoptimized
            />
          </div>
        )}
        <div className="bg-gray-0 px-3 pb-4 dark:bg-gray-0-dark">
          <div className="flex justify-between gap-1 pb-2">
            <h1>{tournament.name}</h1>
            {tournament.default_permission === null && (
              <strong className="mt-4 self-start rounded-sm bg-blue-300 px-1 text-sm uppercase text-gray-900 dark:bg-blue-300-dark dark:text-gray-900-dark">
                {t("private")}
              </strong>
            )}
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
                text={tournament.questions_count.toString()}
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

          <div className="mt-3 flex flex-col gap-3">
            <ProjectLeaderboard
              projectId={tournament.id}
              userId={currentUser?.id}
              isQuestionSeries={isQuestionSeries}
            />
            {currentUser && (
              <ProjectContributions
                project={tournament}
                userId={currentUser.id}
              />
            )}
          </div>
        </div>

        <section className="mx-2 border-t border-t-[#e5e7eb] px-1 py-4">
          <div className="mb-5 flex flex-row justify-between">
            <h2 className="m-0">{questionsTitle}</h2>
            {currentUser && (
              <Button href={`/questions/create?tournament_id=${tournament.id}`}>
                + {t("question")}
              </Button>
            )}
          </div>
          <TournamentFilters />
          <TournamentFeed tournament={tournament} />
        </section>
      </div>
      {!minimalUI &&
        [ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(
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
