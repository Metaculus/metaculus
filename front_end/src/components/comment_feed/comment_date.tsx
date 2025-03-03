import "@github/relative-time-element";
import { differenceInSeconds } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import { CommentType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";

export const CommentDate: FC<{ comment: CommentType }> = ({ comment }) => {
  const locale = useLocale();
  const t = useTranslations();
  const wasEdited = useMemo(
    () =>
      comment.edited_at &&
      differenceInSeconds(comment.edited_at, comment.created_at) > 30,
    [comment.edited_at, comment.created_at]
  );

  return (
    <a
      href={`#comment-${comment.id}`}
      className="text-sm no-underline opacity-55 sm:text-base"
    >
      <relative-time datetime={comment.created_at} format="relative">
        {formatDate(locale, new Date(comment.created_at))}
      </relative-time>
      {wasEdited && (
        <>
          <span className="mx-1">·</span>
          <span className="text-sm">
            ({t("edited")}&nbsp;
            <relative-time datetime={comment.edited_at} format="relative">
              ({formatDate(locale, new Date(comment.edited_at))})
            </relative-time>
            )
          </span>
        </>
      )}
    </a>
  );
};
