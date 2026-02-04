import { isNil } from "lodash";
import { Metadata } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import invariant from "ts-invariant";

import ProjectContributions from "@/app/(main)/(leaderboards)/contributions/components/project_contributions";
import ProjectLeaderboard from "@/app/(main)/(leaderboards)/leaderboard/components/project_leaderboard";
import TournamentSubscribeButton from "@/app/(main)/(tournaments)/tournament/components/tournament_subscribe_button";
import HtmlContent from "@/components/html_content";
import TournamentFilters from "@/components/tournament_filters";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { defaultDescription } from "@/constants/metadata";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { SearchParams } from "@/types/navigation";
import { ProjectPermissions } from "@/types/post";
import { ProjectVisibility, TournamentType } from "@/types/projects";
import { getValidString, stripHtmlTags } from "@/utils/formatters/string";
import { getProjectLink } from "@/utils/navigation";
import { getPublicSettings } from "@/utils/public_settings.server";

import HeaderBlockInfo from "../components/header_block_info";
import HeaderBlockNav from "../components/header_block_navigation";
import ProjectMembers from "../components/members";
import NavigationBlock from "../components/navigation_block";
import ParticipationBlock from "../components/participation_block";
import PredictionFlowButton from "../components/prediction_flow_button";
import TournamentFeed from "../components/tournament_feed";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const tournament = await ServerProjectsApi.getTournament(slug);
  if (!tournament) return {};

  const raw = tournament.subtitle || tournament.description || "";
  const parsedDescription =
    stripHtmlTags(raw).split("\n")[0] || defaultDescription;

  const { PUBLIC_APP_URL } = getPublicSettings();

  const img = `${PUBLIC_APP_URL}/og/tournament/${encodeURIComponent(slug)}/route?theme=light`;

  return {
    title:
      getValidString(tournament.html_metadata_json?.title) ?? tournament.name,
    description:
      getValidString(tournament.html_metadata_json?.description) ??
      getValidString(parsedDescription) ??
      defaultDescription,
    openGraph: {
      title: tournament.name,
      description: parsedDescription,
      images: [
        {
          url: img,
          width: 1200,
          height: 630,
          alt: tournament.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: tournament.name,
      description: parsedDescription,
      images: [img],
    },
    ...(tournament.visibility === ProjectVisibility.Unlisted
      ? { robots: { index: false, follow: false } }
      : {}),
  };
}

export default async function TournamentSlug(props: Props) {
  const params = await props.params;
  const tournament = await ServerProjectsApi.getTournament(params.slug);
  invariant(tournament, `Tournament not found: ${params.slug}`);

  // Ensure project has a correct link.
  // E.g. if tournament with /index/ url -> redirect to /tournament/
  const correctLink = getProjectLink(tournament);
  const headersList = await headers();
  const originalUrl = headersList.get("x-url") || "";

  if (!originalUrl.includes(correctLink)) {
    redirect(correctLink);
  }

  const { PUBLIC_MINIMAL_UI } = getPublicSettings();
  const currentUser = await ServerProfileApi.getMyProfile();
  const isForecastsFlowEnabled =
    tournament.forecasts_flow_enabled &&
    !tournament.timeline.all_questions_closed;
  const predictionFlowPosts =
    isForecastsFlowEnabled && !isNil(currentUser)
      ? await ServerPostsApi.getTournamentForecastFlowPosts(params.slug)
      : [];
  const t = await getTranslations();
  const isQuestionSeries = tournament.type === TournamentType.QuestionSeries;
  const questionsTitle = isQuestionSeries
    ? t("SeriesContents")
    : t("questions");

  return (
    <main className="mx-auto mb-16 min-h-min w-full max-w-[780px] flex-auto px-0 sm:mt-[52px]">
      {/* header block */}
      <div className="rounded-b-md bg-gray-0 dark:bg-gray-0-dark sm:rounded-md">
        {!!tournament.header_image && (
          <div className="relative h-[130px] w-full">
            <HeaderBlockNav
              tournament={tournament}
              className="absolute z-10 px-4 py-3 md:p-2.5"
              variant="image_overflow"
            />

            <div className="overflow-hidden">
              <Image
                src={tournament.header_image}
                alt=""
                fill
                priority
                className="size-full object-cover object-center"
                unoptimized
              />
            </div>
          </div>
        )}
        <div className="px-4 pb-5 pt-4 sm:p-8">
          {!tournament.header_image && (
            <HeaderBlockNav
              tournament={tournament}
              className="mb-2.5 md:mb-4"
            />
          )}
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

          <HeaderBlockInfo tournament={tournament} />
        </div>
      </div>

      <NavigationBlock tournament={tournament} />
      {tournament.type !== TournamentType.Index && (
        <ParticipationBlock
          tournament={tournament}
          posts={predictionFlowPosts}
        />
      )}

      {/* Description block */}
      <div className="mx-4 mt-4 rounded-md bg-gray-0 p-4 dark:bg-gray-0-dark sm:p-8 lg:mx-0">
        <div>
          <HtmlContent content={tournament.description} allowStyleTag />

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

        {tournament.type === TournamentType.Index && (
          <div className="mt-4">
            <PredictionFlowButton tournament={tournament} />
            <ParticipationBlock
              tournament={tournament}
              posts={predictionFlowPosts}
            />
          </div>
        )}
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
        ) && (
          <Suspense fallback={<LoadingIndicator />}>
            <ProjectMembers project={tournament} />
          </Suspense>
        )}
    </main>
  );
}
