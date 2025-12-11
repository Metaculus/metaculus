"use server";
import { intlFormat } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { FC } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import Button from "@/components/ui/button";
import { NotebookPost } from "@/types/post";
import cn from "@/utils/core/cn";
import { estimateReadingTime, getMarkdownSummary } from "@/utils/markdown";
import { getPostLink } from "@/utils/navigation";

const CARD_GRADIENTS = [
  "radial-gradient(ellipse at center, #ede28f 0%, #c5b3c2 50%, #9d83f5 100%)",
  "radial-gradient(ellipse at center, #b5ed8f 0%, #d5b889 50%, #f58383 100%)",
  "radial-gradient(ellipse at center, #ed8fd9 0%, #b8c2c7 50%, #83f5b4 100%)",
  "radial-gradient(ellipse at center, #ed8f8f 0%, #f1bf89 50%, #f5ef83 100%)",
];

type Props = {
  posts: NotebookPost[];
  className?: string;
};

const ResearchAndUpdates: FC<Props> = async ({ posts, className }) => {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <section className={className}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1 text-gray-1000 dark:text-gray-1000-dark">
          <h2 className="m-0 text-xl font-bold leading-7">
            {t("researchAndUpdates")}
          </h2>
          <p className="m-0 max-w-[420px] text-base font-medium leading-6 text-gray-1000 dark:text-gray-1000-dark">
            {t("partnersUseForecasts")}
          </p>
        </div>
        <Button
          href="/notebooks/"
          variant="secondary"
          size="md"
          className="w-fit whitespace-nowrap"
        >
          {t("seeMore")} →
        </Button>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {posts.slice(0, 4).map((post, index) => (
          <PostCard key={post.id} post={post} index={index} locale={locale} />
        ))}
      </div>
    </section>
  );
};

type PostCardProps = {
  post: NotebookPost;
  index: number;
  locale: string;
};

const PostCard: FC<PostCardProps> = async ({ post, index, locale }) => {
  const t = await getTranslations();
  const {
    title,
    created_at,
    id,
    notebook,
    slug,
    author_username,
    comment_count = 0,
  } = post;

  const readingTime = estimateReadingTime(notebook.markdown);
  const summary =
    notebook.markdown_summary ||
    getMarkdownSummary({
      markdown: notebook.markdown,
      width: 280,
      height: 60,
      withLinks: false,
    });

  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <Link
      href={getPostLink({ id, slug, notebook })}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-blue-400 bg-gray-0 no-underline transition-shadow hover:shadow-lg",
        "dark:border-blue-400-dark dark:bg-gray-0-dark"
      )}
    >
      <div className="p-3 pb-0">
        {notebook.image_url && false ? (
          <Image
            src={notebook.image_url}
            alt=""
            width={320}
            height={180}
            quality={100}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="aspect-video w-full rounded object-cover object-center"
          />
        ) : (
          <div
            className="aspect-video w-full rounded"
            style={{ background: gradient }}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-2 p-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium leading-3 text-gray-500 dark:text-gray-500-dark">
            {intlFormat(
              new Date(created_at),
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              },
              { locale }
            )}
          </span>
          <h3 className="m-0 line-clamp-2 text-base font-bold leading-5 text-gray-900 dark:text-gray-900-dark">
            {title}
          </h3>
          <p className="m-0 line-clamp-4 text-sm font-medium leading-5 text-gray-700 dark:text-gray-700-dark">
            {summary}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium leading-5 text-gray-900 dark:text-gray-900-dark">
            {author_username}
          </span>
          <div className="flex items-center gap-1 text-sm font-medium leading-5">
            <span className="text-gray-500 dark:text-gray-500-dark">
              {comment_count} {t("commentsWithCount", { count: comment_count })}
            </span>
            <span className="text-gray-400 dark:text-gray-400-dark">•</span>
            <span className="text-gray-500 dark:text-gray-500-dark">
              {t("estimatedReadingTime", { minutes: readingTime })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default WithServerComponentErrorBoundary(ResearchAndUpdates);
