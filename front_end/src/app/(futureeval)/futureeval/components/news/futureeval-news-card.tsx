"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import CircleDivider from "@/components/ui/circle_divider";
import { NotebookPost } from "@/types/post";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";
import { getPostLink } from "@/utils/navigation";

import { FE_COLORS, FE_TYPOGRAPHY } from "../../theme";

type Props = {
  post: NotebookPost;
};

/**
 * FutureEval News Card
 *
 * A themed variant of the NewsCard for the FutureEval project.
 * Differences from the main NewsCard:
 * - No article type label (serif blue text)
 * - No cover image
 * - No description/summary
 * - Uses FutureEval theme colors and typography
 * - Background matches the FutureEval page background
 */
const FutureEvalNewsCard: FC<Props> = ({ post }) => {
  const locale = useLocale();
  const t = useTranslations();
  const commentsCount = post.comment_count ?? 0;

  return (
    <div
      className={cn(
        "rounded-lg border",
        FE_COLORS.bgCard,
        FE_COLORS.cardBorder
      )}
    >
      <Link
        href={getPostLink(post)}
        className="flex flex-col items-stretch gap-2 p-4 no-underline sm:p-6"
      >
        {/* Title - using FE typography h3 */}
        <h2
          className={cn(
            "m-0 line-clamp-2",
            FE_TYPOGRAPHY.h3,
            FE_COLORS.textHeading
          )}
        >
          {post.title}
        </h2>

        {/* Metadata - date, author, comments, reading time */}
        <div
          className={cn(
            "mt-auto line-clamp-1 leading-tight",
            FE_TYPOGRAPHY.bodySmall,
            FE_COLORS.textMuted
          )}
        >
          <span suppressHydrationWarning>
            {formatDate(locale, new Date(post.published_at))}
          </span>
          <CircleDivider className="mx-2 opacity-60" />
          <span>by {post.author_username}</span>
          <CircleDivider className="mx-2 opacity-60" />
          <span>
            {`${commentsCount ? `${commentsCount} ` : ""}${t("commentsWithCount", { count: commentsCount })}`}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default FutureEvalNewsCard;
