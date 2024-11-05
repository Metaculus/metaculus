import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import CommunityHeader from "@/app/(main)/components/headers/community_header";
import Header from "@/app/(main)/components/headers/header";
import NotebookContentSections from "@/app/(main)/notebooks/components/notebook_content_sections";
import NotebookEditor from "@/app/(main)/notebooks/components/notebook_editor";
import {
  NOTEBOOK_COMMENTS_TITLE,
  NOTEBOOK_CONTENT_SECTION,
  NOTEBOOK_TITLE,
} from "@/app/(main)/notebooks/constants/page_sections";
import PostHeader from "@/app/(main)/questions/[id]/components/post_header";
import imagePlaceholder from "@/app/assets/images/tournament.webp";
import CommentFeed from "@/components/comment_feed";
import { SharePostMenu, PostDropdownMenu } from "@/components/post_actions";
import CircleDivider from "@/components/ui/circle_divider";
import { POST_CATEGORIES_FILTER } from "@/constants/posts_feed";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { PostWithNotebook } from "@/types/post";
import { TournamentType } from "@/types/projects";
import { formatDate } from "@/utils/date_formatters";
import { estimateReadingTime, getQuestionTitle } from "@/utils/questions";

export default async function IndividualNotebook({
  params,
}: {
  params: { id: number; slug: string[] };
}) {
  const postData = await PostsApi.getPost(params.id);
  const defaultProject = postData.projects.default_project;

  if (!postData.notebook) {
    return notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations();
  const questionTitle = getQuestionTitle(postData);

  const isCommunityQuestion = defaultProject.type === TournamentType.Community;
  let currentCommunity = null;
  if (isCommunityQuestion) {
    currentCommunity = await ProjectsApi.getCommunity(
      defaultProject.slug as string
    );
  }

  return (
    <>
      {isCommunityQuestion ? (
        <CommunityHeader community={currentCommunity} />
      ) : (
        <Header />
      )}
      <main className="mx-auto mb-24 mt-12 flex w-full max-w-6xl flex-1 flex-col bg-gray-0 p-4 text-base text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark xs:p-8">
        {postData.notebook.image_url &&
        postData.notebook.image_url.startsWith("https:") ? (
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
        ) : (
          <Image
            className="mb-8 h-auto max-h-72 w-full object-cover"
            src={imagePlaceholder}
            alt=""
            placeholder={"blur"}
            quality={100}
          />
        )}

        <PostHeader post={postData} questionTitle={questionTitle} />

        <h1
          id={NOTEBOOK_TITLE}
          className="mb-4 mt-0 font-serif text-3xl leading-tight text-blue-900 dark:text-blue-900-dark sm:text-5xl sm:leading-tight"
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
          <div className="flex items-center gap-1">
            <SharePostMenu questionTitle={questionTitle} />
            <PostDropdownMenu post={postData} />
          </div>
        </div>

        <hr className="my-4 border-gray-400 dark:border-gray-400-dark" />

        <div className="block md:flex md:gap-8">
          <div className="inline w-full md:mt-3 md:min-w-56 md:max-w-56">
            <NotebookContentSections
              commentsCount={postData.comment_count ?? 0}
              unreadComments={postData.unread_comment_count}
            />
          </div>
          <div className="w-full">
            <NotebookEditor
              postData={postData as PostWithNotebook}
              contentId={NOTEBOOK_CONTENT_SECTION}
            />
            {!!postData.projects.category?.length && (
              <div>
                <div>{t("categories") + ":"}</div>
                <div>
                  {postData.projects.category?.map((category) => (
                    <Link
                      key={category.id}
                      href={`/questions?${POST_CATEGORIES_FILTER}=${category.slug}`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <CommentFeed
              postData={postData}
              postPermissions={postData.user_permission}
              id={NOTEBOOK_COMMENTS_TITLE}
            />
          </div>
        </div>
      </main>
    </>
  );
}
