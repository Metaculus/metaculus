import { useLocale } from "next-intl";
import { FC, useState, useEffect, useRef } from "react";

import { CommentType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";

export const CommentDate: FC<{ comment: CommentType }> = ({ comment }) => {
  const locale = useLocale();
  return (
    <a
      href={`#comment-${comment.id}`}
      className="no-underline opacity-55"
      title={comment.created_at}
    >
      {formatDate(locale, new Date(comment.created_at))}
    </a>
  );
};
