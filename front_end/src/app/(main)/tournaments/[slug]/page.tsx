import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FC, Suspense } from "react";
import invariant from "ts-invariant";

import { generateFiltersFromSearchParams } from "@/app/(main)/questions/helpers/filters";
import ProjectMembers from "@/app/(main)/tournaments/components/members";
import InviteUsers from "@/app/(main)/tournaments/components/members_invite";
import UsersManage from "@/app/(main)/tournaments/components/members_manage";
import HtmlContent from "@/components/html_content";
import AwaitedLeaderboard from "@/components/leaderboard";
import AwaitedPostsFeed from "@/components/posts_feed";
import PostsFilters from "@/components/posts_filters";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostsParams } from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { SearchParams } from "@/types/navigation";
import { ProjectPermissions } from "@/types/post";
import { TournamentType } from "@/types/projects";
import { formatDate } from "@/utils/date_formatters";

export default async function TournamentSlug({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const tournament = await ProjectsApi.getSlugTournament(params.slug);
  invariant(tournament, `Tournament not found: ${params.slug}`);

  const questionFilters = generateFiltersFromSearchParams(searchParams);
  const pageFilters: PostsParams = {
    ...questionFilters,
    tournaments: params.slug,
  };

  const [categories, tags] = await Promise.all([
    ProjectsApi.getCategories(),
    ProjectsApi.getTags(),
  ]);

  const t = await getTranslations();
  const locale = await getLocale();
  const title =
    tournament.type === TournamentType.QuestionSeries
      ? t("QuestionSeries")
      : t("Tournament");
  const questionsTitle =
    tournament.type === TournamentType.QuestionSeries
      ? t("SeriesContents")
      : t("questions");

  return (
    <main className="mx-auto mb-16 mt-4 min-h-min w-full max-w-[780px] flex-auto px-0">
      <div className="bg-gray-0 dark:bg-gray-0-dark">
        <div
          className={classNames(
            " flex flex-wrap items-center gap-2.5 rounded-t px-3 py-1.5 text-[20px] uppercase text-gray-100 dark:text-gray-100-dark",
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
            />
          </div>
        )}
        <div className="bg-gray-0 px-3 pb-4 dark:bg-gray-0-dark">
          <div className="pb-2">
            <h1>{tournament.name}</h1>
          </div>
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
          <HtmlContent content={tournament.description} />
        </div>
        <div>
          <AwaitedLeaderboard projectId={tournament.id} />
        </div>
        {[ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(
          tournament.user_permission
        ) && (
          <section className="mx-2 border-t border-t-[#e5e7eb] px-1 py-4">
            <div className="flex w-full justify-center">
              <Button href={`/questions/create?tournament=${tournament.id}`}>
                Add Question
              </Button>
            </div>
          </section>
        )}
        <section className="mx-2 border-t border-t-[#e5e7eb] px-1 py-4">
          <h2 className="mb-5">{questionsTitle}</h2>
          <PostsFilters categories={categories} tags={tags} />
          <Suspense
            key={JSON.stringify(searchParams)}
            fallback={
              <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
            }
          >
            <AwaitedPostsFeed filters={pageFilters} />
          </Suspense>
        </section>
      </div>
      {[ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(
        tournament.user_permission
      ) && <ProjectMembers project={tournament} />}
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
