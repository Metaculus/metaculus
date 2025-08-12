"use client";

import { addWeeks, isAfter } from "date-fns";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import { CommentOfWeekType } from "@/types/comment";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";

import HighlightedCommentCard from "./highlighted_comment_card";
import WeekSelector from "./week_selector";

type Props = {
  comments: CommentOfWeekType[];
  weekStart: Date;
  currentUser: CurrentUser | null;
};

const CommentsOfWeekContent: FC<Props> = ({
  comments,
  weekStart,
  currentUser,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const isFinal = isAfter(new Date(), addWeeks(weekStart, 2));

  const onExcludeToggleFinished = () => {
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl px-1.5 md:px-0">
      <div className="mb-6 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center md:gap-0">
        <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-800-dark md:block md:text-3xl">
          {t("weeklyTopComments")}
        </h1>
        <WeekSelector weekStart={weekStart} className="w-full md:w-fit" />
      </div>

      <p className="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-700-dark">
        Top comments are determined by comment votes, key factor votes, and
        minds changed. Bonus points are awarded for strong scores across
        multiple categories. Only votes cast within a week of a comment count,
        with rankings finalized after that seven-day period.
      </p>
      <p
        className={cn(
          "font-bold text-gray-800 dark:text-gray-800-dark",
          isFinal && "hidden"
        )}
        suppressHydrationWarning
      >
        The rankings below will be final on{" "}
        {formatDate(locale, addWeeks(weekStart, 2))}.
      </p>

      <div className="space-y-4">
        {comments.map((comment, index) => (
          <HighlightedCommentCard
            key={comment.id}
            comment={comment}
            placement={index + 1}
            currentUser={currentUser}
            onExcludeToggleFinished={onExcludeToggleFinished}
          />
        ))}
      </div>
    </div>
  );
};

export default CommentsOfWeekContent;
