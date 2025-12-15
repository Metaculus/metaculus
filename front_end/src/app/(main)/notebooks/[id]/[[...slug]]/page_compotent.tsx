import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";

import CommentsFeedProvider from "@/app/(main)/components/comments_feed_provider";
import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import NotebookContentSections from "@/app/(main)/notebooks/components/notebook_content_sections";
import NotebookEditor from "@/app/(main)/notebooks/components/notebook_editor";
import {
  NOTEBOOK_COMMENTS_TITLE,
  NOTEBOOK_CONTENT_SECTION,
  NOTEBOOK_TITLE,
} from "@/app/(main)/notebooks/constants/page_sections";
import { PostStatusBox } from "@/app/(main)/questions/[id]/components/post_status_box";
import CommentFeed from "@/components/comment_feed";
import { PostDropdownMenu, SharePostMenu } from "@/components/post_actions";
import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostSubscribeButton from "@/components/post_subscribe/subscribe_button";
import Chip from "@/components/ui/chip";
import CircleDivider from "@/components/ui/circle_divider";
import { POST_CATEGORIES_FILTER } from "@/constants/posts_feed";
import { PostSubscriptionProvider } from "@/contexts/post_subscription_context";
import ServerPostsApi from "@/services/api/posts/posts.server";
import ServerProjectsApi from "@/services/api/projects/projects.server";
import { PostStatus } from "@/types/post";
import { TaxonomyProjectType, TournamentType } from "@/types/projects";
import { formatDate } from "@/utils/formatters/date";
import { estimateReadingTime } from "@/utils/markdown";
import { getProjectLink } from "@/utils/navigation";
import { getPostTitle, isNotebookPost } from "@/utils/questions/helpers";

const IndividualNotebookPage: FC<{
  params: { id: number; slug: string[] };
}> = async ({ params }) => {
  const postData = await ServerPostsApi.getPost(params.id);
  const defaultProject = postData.projects.default_project;

  if (!isNotebookPost(postData)) {
    return notFound();
  }

  const isCommunityQuestion = defaultProject.type === TournamentType.Community;
  let currentCommunity = null;
  if (isCommunityQuestion) {
    currentCommunity = await ServerProjectsApi.getCommunity(
      defaultProject.slug as string
    );
  }

  const locale = await getLocale();
  const t = await getTranslations();
  const questionTitle = getPostTitle(postData);

  const HeaderElement = isCommunityQuestion ? (
    <CommunityHeader community={currentCommunity} />
  ) : (
    <Header />
  );

  return (
    <>
      {HeaderElement}

      <main className="mx-auto mb-24 mt-12 flex w-full max-w-6xl flex-1 flex-col bg-gray-0 p-4 text-base text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark xs:p-8">
        {postData.notebook.image_url &&
          postData.notebook.image_url.startsWith("https:") && (
            <Image
              src={postData.notebook.image_url}
              alt=""
              // fill
              priority
              width={1088}
              height={180}
              sizes="(max-width: 1200px) 100%, 1088px"
              className="relative mb-8 h-auto max-h-72 w-full object-cover"
              quality={100}
            />
          )}

        <PostStatusBox post={postData} className="mb-5 rounded lg:mb-6" />

        <h1
          id={NOTEBOOK_TITLE}
          className="mb-4 mt-2 font-serif text-3xl leading-tight text-blue-900 dark:text-blue-900-dark sm:text-5xl sm:leading-tight lg:mt-3"
        >
          {postData.title}
        </h1>
        <div className="flex justify-between gap-2">
          <div className="flex flex-wrap items-center text-gray-700 dark:text-gray-700-dark">
            <span className="whitespace-nowrap">
              by{" "}
              <Link
                href={`/accounts/profile/${postData.author_id}`}
                className="font-bold no-underline hover:underline"
              >
                {postData.author_username}
              </Link>
            </span>
            <CircleDivider className="mx-1" />

            <span className="whitespace-nowrap">
              {formatDate(locale, new Date(postData.published_at))}
            </span>
            <CircleDivider className="mx-1" />
            <span className="whitespace-nowrap">
              Edited on{" "}
              {formatDate(locale, new Date(postData.notebook.edited_at))}
            </span>
            <CircleDivider className="mx-1" />
            <span className="whitespace-nowrap">
              {t("estimatedReadingTime", {
                minutes: estimateReadingTime(postData.notebook.markdown),
              })}
            </span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <PostVoter
              className="justify-end sm:mr-3 sm:w-auto"
              post={postData}
              questionPage
            />
            <div className="flex items-center gap-1">
              <PostSubscriptionProvider post={postData}>
                {postData.curation_status == PostStatus.APPROVED && (
                  <>
                    <div className="mr-2 hidden lg:block">
                      <PostSubscribeButton />
                    </div>
                  </>
                )}
                <div className="hidden lg:block">
                  <SharePostMenu questionTitle={questionTitle} />
                </div>
                <PostDropdownMenu post={postData} />
              </PostSubscriptionProvider>
            </div>
          </div>
        </div>

        <hr className="my-4 border-gray-400 dark:border-gray-400-dark" />

        <div className="block md:flex md:gap-8">
          <div className="mb-2 w-full md:mb-0 md:mt-3 md:min-w-56 md:max-w-56">
            <NotebookContentSections
              commentsCount={postData.comment_count ?? 0}
              unreadComments={postData.unread_comment_count}
            />
          </div>
          <div className="w-full">
            <NotebookEditor
              postData={postData}
              contentId={NOTEBOOK_CONTENT_SECTION}
            />
            <div className="flex flex-col gap-2">
              {/* Project chips (tournaments, question series, communities, etc.) */}
              {(() => {
                const allProjects = [
                  ...(postData.projects.index ?? []),
                  ...(postData.projects.tournament ?? []),
                  ...(postData.projects.question_series ?? []),
                  ...(postData.projects.community ?? []),
                  ...(postData.projects.category ?? []),
                  ...(postData.projects.leaderboard_tag ?? []),
                ];
                const getChipText = (name: string, type?: string) =>
                  type === "leaderboard_tag" ? `🏆 ${name}` : name;

                return allProjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allProjects.map((element) => (
                      <Chip
                        color={
                          Object.values(TaxonomyProjectType).includes(
                            element.type as TaxonomyProjectType
                          )
                            ? "olive"
                            : "orange"
                        }
                        key={element.id}
                        href={getProjectLink(element)}
                      >
                        {getChipText(element.name, element.type)}
                      </Chip>
                    ))}
                  </div>
                ) : null;
              })()}
            </div>
            <CommentsFeedProvider
              postData={postData}
              rootCommentStructure={true}
            >
              <CommentFeed
                postData={postData}
                id={NOTEBOOK_COMMENTS_TITLE}
                inNotebook={true}
              />
            </CommentsFeedProvider>
          </div>
        </div>
      </main>
    </>
  );
};

export default IndividualNotebookPage;
