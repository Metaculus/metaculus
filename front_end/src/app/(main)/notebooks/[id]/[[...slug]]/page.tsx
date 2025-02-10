import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { remark } from "remark";
import strip from "strip-markdown";

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
import CommentFeed from "@/components/comment_feed";
import { SharePostMenu, PostDropdownMenu } from "@/components/post_actions";
import PostSubscribeButton from "@/components/post_subscribe/subscribe_button";
import CircleDivider from "@/components/ui/circle_divider";
import { defaultDescription } from "@/constants/metadata";
import {
  POST_CATEGORIES_FILTER,
  POST_TAGS_FILTER,
} from "@/constants/posts_feed";
import PostsApi from "@/services/posts";
import ProjectsApi from "@/services/projects";
import { PostStatus, NotebookPost } from "@/types/post";
import { TournamentType } from "@/types/projects";
import { formatDate } from "@/utils/date_formatters";
import { estimateReadingTime, getQuestionTitle } from "@/utils/questions";

import IndexNotebook from "../../components/index_notebook";
import { NOTEBOOK_INDEXES } from "../../constants/indexes";

type Props = {
  params: { id: number; slug: string[] };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const postData = await PostsApi.getPost(params.id);

  if (!postData) {
    return {};
  }

  const file = remark().use(strip).processSync(postData.notebook?.markdown);
  const parsedDescription = String(file).split("\n")[0];

  return {
    title: postData.title,
    description: !!parsedDescription ? parsedDescription : defaultDescription,
  };
}

export default async function IndividualNotebook({ params }: Props) {
  const postData = await PostsApi.getPost(params.id);
  const defaultProject = postData.projects.default_project;

  if (!postData.notebook) {
    return notFound();
  }

  const isCommunityQuestion = defaultProject.type === TournamentType.Community;
  let currentCommunity = null;
  if (isCommunityQuestion) {
    currentCommunity = await ProjectsApi.getCommunity(
      defaultProject.slug as string
    );
  }

  const locale = await getLocale();
  const t = await getTranslations();
  const questionTitle = getQuestionTitle(postData);

  const HeaderElement = isCommunityQuestion ? (
    <CommunityHeader community={currentCommunity} />
  ) : (
    <Header />
  );

  // we can pass custom slug for indexes in params
  const slugParam = params.slug?.[0] ?? postData.slug;
  const indexNotebook = NOTEBOOK_INDEXES[slugParam];
  if (!!indexNotebook) {
    const questionIds = indexNotebook.map((q) => q.questionId);
    const questionWeightsMap = Object.fromEntries(
      indexNotebook.map((q) => [q.questionId, q.weight])
    );

    return (
      <>
        {HeaderElement}
        <IndexNotebook
          postData={postData}
          questionTitle={questionTitle}
          questionIds={questionIds}
          questionWeightsMap={questionWeightsMap}
        />
      </>
    );
  }

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

        <PostHeader post={postData} questionTitle={questionTitle} />

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
          <div className="flex items-center gap-1">
            {postData.curation_status == PostStatus.APPROVED && (
              <>
                <div className="mr-3 hidden lg:block">
                  <PostSubscribeButton post={postData} />
                </div>
                <div className="lg:hidden">
                  <PostSubscribeButton post={postData} mini />
                </div>
              </>
            )}
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
              postData={postData as NotebookPost}
              contentId={NOTEBOOK_CONTENT_SECTION}
            />
            <div className="flex flex-col gap-2">
              {!!postData.projects.category?.length && (
                <div>
                  <span className="font-medium">{t("Categories") + ":"}</span>
                  {postData.projects.category?.map((category, index) => (
                    <span key={category.id}>
                      {" "}
                      <Link
                        className="text-gray-800 no-underline hover:underline dark:text-gray-800-dark"
                        href={`/questions?${POST_CATEGORIES_FILTER}=${category.slug}`}
                      >
                        {category.name}
                      </Link>
                      {index < (postData.projects.category?.length ?? 0) - 1
                        ? ","
                        : "."}
                    </span>
                  ))}
                </div>
              )}
              {!!postData.projects.tag?.length && (
                <div>
                  <span className="font-medium">{t("tags") + ":"}</span>
                  {postData.projects.tag?.map((tag, index) => (
                    <span key={tag.id}>
                      {" "}
                      <Link
                        className="text-gray-800 no-underline hover:underline dark:text-gray-800-dark"
                        href={`/questions?${POST_TAGS_FILTER}=${tag.slug}`}
                      >
                        {tag.name}
                      </Link>
                      {index < (postData.projects.tag?.length ?? 0) - 1
                        ? ","
                        : "."}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <CommentFeed
              postData={postData}
              id={NOTEBOOK_COMMENTS_TITLE}
              inNotebook={true}
            />
          </div>
        </div>
      </main>
    </>
  );
}
