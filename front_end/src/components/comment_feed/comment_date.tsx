import { useLocale } from "next-intl";
import { FC, useState, useEffect, useRef } from "react";

import { CommentType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";

export const CommentDate: FC<{ comment: CommentType }> = ({ comment }) => {
  const locale = useLocale();
  return (
    <span title={comment.created_at} className="opacity-55">
      {formatDate(locale, new Date(comment.created_at))}
    </span>
  );
};
