import { Metadata } from "next";
import { permanentRedirect } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import CommentFeed from "@/components/comment_feed";
import ConditionalTile from "@/components/conditional_tile";
import ConditionalTimeline from "@/components/conditional_timeline";
import { EmbedModalContextProvider } from "@/contexts/embed_modal_context";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import questions from "@/services/questions";
import { SearchParams } from "@/types/navigation";
import { PostConditional, PostStatus, ProjectPermissions } from "@/types/post";
import { TournamentType } from "@/types/projects";
import { QuestionWithNumericForecasts } from "@/types/question";
import { getPostLink } from "@/utils/navigation";
import { getQuestionTitle } from "@/utils/questions";

import BackgroundInfo from "../components/background_info";
import HideCPProvider from "../components/cp_provider";
import DetailedGroupCard from "../components/detailed_group_card";
import DetailedQuestionCard from "../components/detailed_question_card";
import ForecastMaker from "../components/forecast_maker";
import ContinuousGroupTimeline from "../components/forecast_timeline_drawer";
import HistogramDrawer from "../components/histogram_drawer";
import PostHeader from "../components/post_header";
import QuestionEmbedModal from "../components/question_embed_modal";
import QuestionHeaderInfo from "../components/question_header_info";
import QuestionResolutionStatus from "../components/question_resolution_status";
import Sidebar from "../components/sidebar";
import { SLUG_POST_SUB_QUESTION_ID } from "../search_params";

/**
 * A backward compatibility util
 */
async function getPost(id: number, with_cp = true) {
  try {
    return await PostsApi.getPost(id, with_cp);
  } catch (e) {
    const lastLegacyQuestionId = parseInt(
      process.env.LAST_LEGACY_QUESTION_ID || ""
    );
    const nextError = e as Error & { digest?: string };

    // A backward compatibility workaround.
    // Initially, all group question links were generated as /questions/<child_question_id>,
    // which redirected to /questions/<post_id>/?sub-question=<child_question_id>.
    // Now that posts and questions are differentiated, these redirects are no longer supported.
    //
    // This workaround tracks the last known legacy question ID.
    // If a 404 lookup contains an ID lower than the last legacy question ID,
    // we assume it may refer to a child question in a group.
    // If so, we attempt to replace its ID with the original post_id when possible.
    if (
      lastLegacyQuestionId &&
      id <= lastLegacyQuestionId &&
      nextError?.digest === "NEXT_NOT_FOUND"
    ) {
      const { post_id, post_slug } = await questions.legacyGetPostId(id);

      // Permanently redirecting to the correct endpoint
      return permanentRedirect(
        `${getPostLink({ id: post_id, slug: post_slug })}?${SLUG_POST_SUB_QUESTION_ID}=${id}`
      );
    }

    throw e;
  }
}

const cachedGetPost = cache(getPost);

type Props = {
  params: { id: number; slug: string[] };
  searchParams: SearchParams;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const postData = await cachedGetPost(params.id);

  if (!postData) {
    return {};
  }

  const questionTitle = getQuestionTitle(postData);
  return {
    title: questionTitle,
    description: null,
    openGraph: {
      type: "article",
      images: {
        url: `${process.env.NEXT_PUBLIC_CDN_DOMAIN_NAME ?? ""}/api/posts/preview-image/${params.id}/`,
        width: 1200,
        height: 630,
        alt: "community predictions",
      },
    },
    twitter: {
      site: "@metaculus",
      card: "summary_large_image",
      images: {
        url: `${process.env.NEXT_PUBLIC_CDN_DOMAIN_NAME ?? ""}/api/posts/preview-image/${params.id}/`,
        width: 1200,
        height: 630,
        alt: "community predictions",
      },
    },
  };
}

export default async function IndividualQuestion({
  params,
  searchParams,
}: Props) {
  const postData = await cachedGetPost(params.id);
  const defaultProject = postData.projects.default_project;

  if (postData.notebook) {
    return redirect(
      `/notebooks/${postData.id}${params.slug ? `/${params.slug}` : ""}`
    );
  }

  const isCommunityQuestion = defaultProject.type === TournamentType.Community;
  let currentCommunity = null;
  if (isCommunityQuestion) {
    currentCommunity = await ProjectsApi.getCommunity(
      defaultProject.slug as string
    );
  }

  const preselectedGroupQuestionId =
    extractPreselectedGroupQuestionId(searchParams);
  const t = await getTranslations();

  let typeLabel = t("notebook");
  if (postData.group_of_questions) {
    typeLabel = t("group");
  } else if (postData.conditional) {
    typeLabel = t("conditional");
  } else if (postData.question) {
    typeLabel = t("question");
  }

  let edit_type = "question";
  if (postData.group_of_questions) {
    edit_type = "group";
  } else if (postData.conditional) {
    edit_type = "conditional";
  } else if (postData.notebook) {
    edit_type = "notebook";
  }

  const allowModifications =
    postData.user_permission === ProjectPermissions.ADMIN ||
    postData.user_permission === ProjectPermissions.CURATOR ||
    (postData.user_permission === ProjectPermissions.CREATOR &&
      postData.curation_status !== PostStatus.APPROVED);

  const questionTitle = getQuestionTitle(postData);
  const isClosed = postData.status === PostStatus.CLOSED;
  return (
    <EmbedModalContextProvider>
      <HideCPProvider post={postData}>
        {isCommunityQuestion ? (
          <CommunityHeader community={currentCommunity} />
        ) : (
          <Header />
        )}
        <main className="mx-auto flex w-full max-w-max flex-col scroll-smooth py-4">
          <div className="hidden gap-3 lg:flex">
            <span className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 dark:bg-blue-400-dark dark:text-blue-700-dark">
              {typeLabel}
            </span>
            {allowModifications && (
              <a
                className="bg-blue-400 px-1.5 py-1 text-sm font-bold uppercase text-blue-700 no-underline dark:bg-blue-400-dark dark:text-blue-700-dark"
                href={`/questions/create/${edit_type}?post_id=${postData.id}`}
              >
                {t("edit")}
              </a>
            )}
          </div>
          <div className="flex gap-4">
            <section className="w-[48rem] max-w-full border-transparent bg-gray-0 px-3 text-gray-900 after:mt-6 after:block after:w-full after:content-[''] dark:border-blue-200-dark dark:bg-gray-0-dark dark:text-gray-900-dark xs:px-4 lg:border">
              <PostHeader post={postData} questionTitle={questionTitle} />
              {!postData.conditional && (
                <div className="mt-2 flex justify-between gap-2 xs:gap-4 sm:gap-8 lg:mb-2 lg:mt-4">
                  <h1 className="m-0 text-xl leading-tight sm:text-3xl">
                    {postData.title}
                  </h1>
                  {postData.resolved && !!postData.question && (
                    <QuestionResolutionStatus post={postData} />
                  )}
                </div>
              )}

              {!!postData.conditional && (
                <ConditionalTile
                  postTitle={postData.title}
                  conditional={postData.conditional}
                  curationStatus={postData.status}
                  nrForecasters={postData.nr_forecasters}
                  withNavigation
                  withCPRevealBtn
                />
              )}
              <QuestionHeaderInfo post={postData} />

              {!!postData.question && (
                <DetailedQuestionCard
                  postStatus={postData.status}
                  question={postData.question}
                  nrForecasters={postData.nr_forecasters}
                />
              )}
              {!!postData.group_of_questions && (
                <DetailedGroupCard
                  actualCloseTime={
                    postData.actual_close_time ?? postData.scheduled_close_time
                  }
                  questions={postData.group_of_questions.questions}
                  preselectedQuestionId={preselectedGroupQuestionId}
                  isClosed={isClosed}
                  graphType={postData.group_of_questions.graph_type}
                  nrForecasters={postData.nr_forecasters}
                  postStatus={postData.status}
                />
              )}

              <ForecastMaker post={postData} />
              {!!postData.conditional && (
                <ConditionalTimeline
                  conditional={
                    postData.conditional as PostConditional<QuestionWithNumericForecasts>
                  }
                  isClosed={isClosed}
                />
              )}

              {!!postData.group_of_questions && (
                <ContinuousGroupTimeline
                  post={postData}
                  preselectedQuestionId={preselectedGroupQuestionId}
                />
              )}

              <BackgroundInfo post={postData} />
              <HistogramDrawer post={postData} />
              <Sidebar
                postData={postData}
                allowModifications={allowModifications}
                layout="mobile"
                questionTitle={questionTitle}
              />

              <CommentFeed
                postData={postData}
                postPermissions={postData.user_permission}
              />
            </section>

            <Sidebar
              postData={postData}
              allowModifications={allowModifications}
              questionTitle={questionTitle}
            />
          </div>
        </main>

        <QuestionEmbedModal postId={postData.id} postTitle={postData.title} />
      </HideCPProvider>
    </EmbedModalContextProvider>
  );
}

function extractPreselectedGroupQuestionId(
  searchParams: SearchParams
): number | undefined {
  const param = searchParams[SLUG_POST_SUB_QUESTION_ID];
  if (typeof param === "string") {
    const id = Number(param);
    return isNaN(id) ? undefined : id;
  }
}
