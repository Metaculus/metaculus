import { faEllipsis, faShareNodes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import NotebookEditor from "@/app/(main)/notebooks/components/notebook_editor";
import imagePlaceholder from "@/app/assets/images/tournament.webp";
import CommentFeed from "@/components/comment_feed";
import Button from "@/components/ui/button";
import CircleDivider from "@/components/ui/circle_divider";
import { POST_CATEGORIES_FILTER } from "@/constants/posts_feed";
import CommentsApi from "@/services/comments";
import PostsApi from "@/services/posts";
import { PostWithNotebook } from "@/types/post";
import { formatDate } from "@/utils/date_formatters";
import { estimateReadingTime } from "@/utils/questions";

export default async function IndividualNotebook({
  params,
}: {
  params: { id: number };
}) {
  const postData = await PostsApi.getPost(params.id);

  if (!postData || !postData.notebook) {
    return notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations();
  const commentsData = await CommentsApi.getComments({ post: params.id });

  return (
    <main className="mx-auto mb-24 mt-12 flex w-full max-w-6xl flex-1 flex-col bg-gray-0 p-4 text-base text-gray-800 dark:bg-gray-0-dark dark:text-gray-800-dark xs:p-8">
      <Image
        className="mb-8 h-auto max-h-72 w-full object-cover"
        src={imagePlaceholder}
        alt=""
        placeholder={"blur"}
      />
      <h1 className="mb-4 mt-0 font-serif text-3xl leading-tight text-blue-900 dark:text-blue-900-dark sm:text-5xl sm:leading-tight">
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
        <div className="flex gap-1">
          <Button
            variant="secondary"
            className="!rounded border-0"
            presentationType="icon"
            size="lg"
          >
            <FontAwesomeIcon icon={faShareNodes} size="lg"></FontAwesomeIcon>
          </Button>
          <Button
            variant="secondary"
            className="!rounded border-0"
            presentationType="icon"
            size="lg"
          >
            <FontAwesomeIcon icon={faEllipsis} size="lg"></FontAwesomeIcon>
          </Button>
        </div>
      </div>

      <hr className="my-4 border-gray-400 dark:border-gray-400-dark" />

      <div className="block md:flex md:gap-8">
        <div className="w-full md:mt-3 md:min-w-56 md:max-w-56">TODO</div>
        <div className="w-full">
          <NotebookEditor postData={postData as PostWithNotebook} />
          <div>
            <div>{t("categories") + ":"}</div>
            <div>
              {postData.projects.category.map((category) => (
                <Link
                  key={category.id}
                  href={`/questions?${POST_CATEGORIES_FILTER}=${category.slug}`}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          <CommentFeed initialComments={commentsData} />
        </div>
      </div>
    </main>
  );
}
