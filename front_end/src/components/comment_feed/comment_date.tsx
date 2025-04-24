import "@github/relative-time-element";
import { differenceInSeconds } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo } from "react";

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
      {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
      <relative-time datetime={comment.created_at} format="relative">
        {formatDate(locale, new Date(comment.created_at))}
        {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
      </relative-time>
      {wasEdited && (
        <>
          <span className="mx-1">·</span>
          <span className="text-sm">
            ({t("edited")}&nbsp;
            {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
            <relative-time datetime={comment.text_edited_at} format="relative">
              ({formatDate(locale, new Date(comment.text_edited_at))})
              {/*@ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
            </relative-time>
            )
          </span>
        </>
      )}
    </a>
  );
};
