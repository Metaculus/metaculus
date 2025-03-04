import { isNil } from "lodash";
import { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FC, Suspense } from "react";
import invariant from "ts-invariant";

import ProjectContributions from "@/app/(main)/(leaderboards)/contributions/components/project_contributions";
import ProjectLeaderboard from "@/app/(main)/(leaderboards)/leaderboard/components/project_leaderboard";
import IndexSection from "@/app/(main)/(tournaments)/tournament/components/index";
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
import { getPublicSettings } from "@/utils/public_settings.server";

import TournamentDropdownMenu from "../components/dropdown_menu";
import TournamentFeed from "../components/tournament_feed";
import TournamentTimeline from "../components/tournament_timeline";
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

export default async function TournamentSlug({ params }: Props) {
  const tournament = await ProjectsApi.getTournament(params.slug);
  invariant(tournament, `Tournament not found: ${params.slug}`);
  const { PUBLIC_MINIMAL_UI } = getPublicSettings();
  const currentUser = await ProfileApi.getMyProfile();

  const t = await getTranslations();
  const locale = await getLocale();
  const isQuestionSeries = tournament.type === TournamentType.QuestionSeries;
  const title = isQuestionSeries
    ? t("QuestionSeries")
    : tournament.type === TournamentType.Index
      ? t("Index")
      : t("Tournament");
  const questionsTitle = isQuestionSeries
    ? t("SeriesContents")
    : t("questions");

  const indexWeights = tournament.index_weights ?? [];

  return (
    <main className="mx-auto mb-16 min-h-min w-full max-w-[780px] flex-auto px-0 sm:mt-[52px]">
      {/* header block */}
      <div className="overflow-hidden rounded-b-md bg-gray-0 dark:bg-gray-0-dark sm:rounded-md">
        <div className="relative h-[130px] w-full">
          <div
            className={cn(
              "absolute z-10 flex h-6 w-full flex-wrap items-center justify-between gap-2.5 bg-transparent p-[10px] text-[20px] uppercase text-gray-100 dark:text-gray-100-dark"
            )}
          >
            <div className="flex items-center gap-2">
              <Link
                href={"/tournaments"}
                className="block rounded-sm bg-black/30 px-1.5 py-1 text-xs font-bold leading-4 text-gray-0 no-underline hover:text-gray-400 dark:hover:text-gray-400-dark"
              >
                {title}
              </Link>
              {tournament.default_permission === null && (
                <strong className="block rounded-sm bg-black/30 px-1.5 py-1 text-xs font-bold uppercase leading-4 text-gray-0">
                  {t("private")}
                </strong>
              )}
            </div>
            <TournamentDropdownMenu tournament={tournament} />
          </div>
          {!!tournament.header_image && (
            <Image
              src={tournament.header_image}
              alt=""
              fill
              priority
              className="size-full object-cover object-center"
              unoptimized
            />
          )}
        </div>
        <div className="px-4 pb-5 pt-4 sm:p-8">
          <div className="flex items-start justify-between gap-1 sm:gap-4">
            <h1 className="m-0 text-xl text-blue-800 dark:text-blue-800-dark md:text-2xl lg:text-3xl xl:text-4xl">
              {tournament.name}
            </h1>

            <div>
              <TournamentSubscribeButton
                user={currentUser}
                tournament={tournament}
              />
            </div>
          </div>

          {tournament.type === TournamentType.Tournament ? (
            <Suspense fallback={<Skeleton />}>
              <TournamentTimeline tournament={tournament} />
            </Suspense>
          ) : (
            <div className="flex flex-wrap gap-x-9 gap-y-4 py-4">
              {!isNil(tournament.prize_pool) && (
                <TournamentStat
                  title={t("prizePool")}
                  text={"$" + Number(tournament.prize_pool).toLocaleString()}
                />
              )}
              <TournamentStat
                title={t("StartDate")}
                text={formatDate(locale, new Date(tournament.start_date))}
              />
              {!isNil(tournament.close_date) && (
                <TournamentStat
                  title={t("EndDate")}
                  text={formatDate(locale, new Date(tournament.close_date))}
                />
              )}
              <TournamentStat
                title={t("questions")}
                text={tournament.questions_count.toString()}
              />
            </div>
          )}
        </div>
      </div>

      {/* Links block */}
      <div className="mx-4 mt-4 flex flex-row justify-between gap-2 lg:mx-0">
        {/* TODO: Uncomment this when the forecast flow is implemented */}
        {/* <Link href="/forecastFlowLink" className="flex-1">
          <Button className="w-full border-blue-400 text-sm text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark md:text-lg">
            {t("forecastFlow")}
          </Button>
        </Link> */}
        <Link href="#questions" className="flex-1">
          <Button className="w-full gap-1 border-blue-400 text-sm text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark md:text-lg">
            {t.rich("viewQuestions", {
              count: tournament.questions_count,
              bold: (chunks) => <span className="font-bold">{chunks}</span>,
            })}
          </Button>
        </Link>
      </div>

      {/* Description block */}
      <div className="mx-4 mt-4 rounded-md bg-gray-0 p-4 dark:bg-gray-0-dark sm:p-8 lg:mx-0">
        <div>
          <HtmlContent content={tournament.description} />

          {indexWeights.length > 0 && (
            <IndexSection indexWeights={indexWeights} />
          )}

          {tournament.score_type && (
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
          )}
        </div>
      </div>

      {/* Questions block */}
      <div
        id="questions"
        className="mt-4 scroll-mt-nav rounded-md bg-gray-0 p-4 dark:bg-gray-0-dark xs:mx-4 sm:p-8 lg:mx-0"
      >
        <section className="mx-2 px-1 py-4">
          <div className="mb-5 flex flex-row justify-between">
            <h2 className="m-0 text-blue-800 dark:text-blue-800-dark">
              {questionsTitle}
            </h2>
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

      {!PUBLIC_MINIMAL_UI &&
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
  <div className="flex flex-col text-blue-800 dark:text-blue-800-dark">
    <span className="text-sm font-normal capitalize leading-5 opacity-50">
      {title}
    </span>
    <span className="text-xl font-bold leading-6">{text}</span>
  </div>
);

const Skeleton: FC = () => {
  return (
    <div className="mt-4 flex min-h-20 flex-col gap-x-5 gap-y-4 sm:mt-5 sm:flex-row">
      <div className="flex flex-1 animate-pulse flex-col justify-between">
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="my-3 h-1 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="flex max-h-20 animate-pulse items-center justify-center rounded bg-gray-200 py-1.5 dark:bg-gray-700 sm:w-[200px] sm:flex-col sm:py-3">
        <div className="h-6 w-24 rounded bg-gray-300 dark:bg-gray-600 sm:h-8 sm:w-32" />
      </div>
    </div>
  );
};
