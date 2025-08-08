import { differenceInSeconds } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

import RelativeTime from "@/components/ui/relative_time";
import { CommentType } from "@/types/comment";
import { formatDate } from "@/utils/formatters/date";

export const CommentDate: FC<{ comment: CommentType }> = ({ comment }) => {
  const locale = useLocale();
  const t = useTranslations();
  const wasEdited = useMemo(
    () =>
      comment.text_edited_at &&
      differenceInSeconds(comment.text_edited_at, comment.created_at) > 30,
    [comment.text_edited_at, comment.created_at]
  );

  return (
    <a
      href={`#comment-${comment.id}`}
      className="text-sm no-underline opacity-55 sm:text-base"
    >
      <RelativeTime datetime={comment.created_at} format="relative">
        {formatDate(locale, new Date(comment.created_at))}
      </RelativeTime>
      {wasEdited && (
        <>
          <span className="mx-1">·</span>
          <span className="text-sm">
            ({t("edited")}&nbsp;
            <RelativeTime datetime={comment.text_edited_at} format="relative">
              ({formatDate(locale, new Date(comment.text_edited_at))})
            </RelativeTime>
            )
          </span>
        </>
      )}
    </a>
  );
};
