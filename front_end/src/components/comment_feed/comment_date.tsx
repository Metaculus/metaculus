import "@github/relative-time-element";
import { useLocale } from "next-intl";
import { FC, useState, useEffect, useRef } from "react";

import { CommentType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";

export const CommentDate: FC<{ comment: CommentType }> = ({ comment }) => {
  const locale = useLocale();
  return (
    <a href={`#comment-${comment.id}`} className="no-underline opacity-55">
      <relative-time datetime={comment.created_at} format="relative">
        {formatDate(locale, new Date(comment.created_at))}
      </relative-time>
    </a>
  );
};
