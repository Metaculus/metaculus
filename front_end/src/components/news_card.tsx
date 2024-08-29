"use client";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import CircleDivider from "@/components/ui/circle_divider";
import useContainerSize from "@/hooks/use_container_size";
import { PostWithNotebook } from "@/types/post";
import { formatDate } from "@/utils/date_formatters";
import { estimateReadingTime, getNotebookSummary } from "@/utils/questions";

type Props = {
  post: PostWithNotebook;
};

const NewsCard: FC<Props> = ({ post }) => {
  const locale = useLocale();
  const t = useTranslations();

  const { ref, width } = useContainerSize<HTMLDivElement>();
  const commentsCount = post.vote.score ?? 0;
  return (
    <div className="rounded bg-gray-0 dark:bg-gray-0-dark">
      <Link
        href={`/notebooks/${post.id}`}
        className="flex flex-col items-stretch no-underline sm:h-64 sm:flex-row-reverse"
      >
        {post.notebook.image_url &&
        post.notebook.image_url.startsWith("https:") && (
          <Image
            src={post.notebook.image_url}
            alt=""
            width={300}
            height={300}
            quality={100}
            className="h-auto w-full object-cover max-sm:h-40 max-sm:rounded-t sm:h-full sm:w-60 sm:rounded-r"
            unoptimized
          />
        )}
        <div className="flex flex-1 flex-col p-6 text-base">
          <span className="mb-3 font-serif font-semibold capitalize text-blue-700 dark:text-blue-700-dark">
            {post.notebook.type}
          </span>
          <h2 className="mt-0 line-clamp-2 font-serif text-2xl font-bold text-blue-900 dark:text-blue-900-dark">
            {post.title}
          </h2>
          <div ref={ref} className="mb-3 h-12">
            {!!width && (
              <MarkdownEditor
                mode="read"
                markdown={getNotebookSummary(post.notebook.markdown, width, 48)}
                contentEditableClassName="font-serif !text-gray-700 !dark:text-gray-700-dark *:m-0"
              />
            )}
          </div>
          <div className="mt-auto line-clamp-1 text-sm font-normal leading-tight text-gray-700 dark:text-gray-700-dark">
            <span>{formatDate(locale, new Date(post.published_at))}</span>
            <CircleDivider className="mx-2" />
            <span>by {post.author_username}</span>
            <CircleDivider className="mx-2" />
            <span>
              {`${commentsCount ? `${commentsCount} ` : ""} ${t("commentsWithCount", { count: commentsCount })}`}
            </span>
            <CircleDivider className="mx-2" />
            <span>
              {t("estimatedReadingTime", {
                minutes: estimateReadingTime(post.notebook.markdown),
              })}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NewsCard;
