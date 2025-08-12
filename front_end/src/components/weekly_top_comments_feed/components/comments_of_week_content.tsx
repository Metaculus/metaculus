"use client";

import { addWeeks, isAfter, format, startOfWeek } from "date-fns";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState, useCallback, useEffect, useMemo } from "react";

import { CommentOfWeekType } from "@/types/comment";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import LoadingIndicator from "@/components/ui/loading_indicator";
import useSearchParams from "@/hooks/use_search_params";

import HighlightedCommentCard from "./highlighted_comment_card";
import WeekSelector from "./week_selector";

type Props = {
  comments: CommentOfWeekType[];
  weekStart: Date;
  currentUser: CurrentUser | null;
};

const CommentsOfWeekContent: FC<Props> = ({
  comments: initialComments,
  weekStart: initialWeekStart,
  currentUser,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const { params, setParam, shallowNavigateToSearchParams } = useSearchParams();

  const [comments, setComments] =
    useState<CommentOfWeekType[]>(initialComments);
  const [weekStart, setWeekStart] = useState<Date>(initialWeekStart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFinal = isAfter(new Date(), addWeeks(weekStart, 2));

  const fetchCommentsForWeek = useCallback(
    async (newWeekStart: Date) => {
      setIsLoading(true);
      setError(null);

      try {
        const formattedDate =
          newWeekStart.toISOString().split("T")[0] ||
          format(newWeekStart, "yyyy-MM-dd");
        const newComments =
          await ClientCommentsApi.getCommentsOfWeek(formattedDate);
        setComments(newComments);
        setWeekStart(newWeekStart);

        // Update URL parameters without triggering a page reload
        setParam("start_date", formattedDate, false);
        setParam("weekly_top_comments", "true", false);
        shallowNavigateToSearchParams();
      } catch (err) {
        setError("Failed to load comments for this week");
        console.error("Error fetching comments:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [setParam, shallowNavigateToSearchParams]
  );

  const onWeekChange = useCallback(
    (newWeekStart: Date) => {
      fetchCommentsForWeek(newWeekStart);
    },
    [fetchCommentsForWeek]
  );

  // Handle URL parameter changes (e.g., from browser back/forward)
  useEffect(() => {
    const startDateParam = params.get("start_date");

    if (startDateParam) {
      const newWeekStart = new Date(startDateParam);
      // Only fetch if the week actually changed
      if (
        format(newWeekStart, "yyyy-MM-dd") !== format(weekStart, "yyyy-MM-dd")
      ) {
        fetchCommentsForWeek(newWeekStart);
      }
    } else {
      // Handle case when no start_date parameter (current week)
      const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
      if (
        format(currentWeekStart, "yyyy-MM-dd") !==
        format(weekStart, "yyyy-MM-dd")
      ) {
        fetchCommentsForWeek(currentWeekStart);
      }
    }
  }, [params, weekStart, fetchCommentsForWeek]);

  const onExcludeToggleFinished = (commentId: number, excluded: boolean) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId ? { ...comment, excluded } : comment
      )
    );
  };

  const commentsWithPlacements = useMemo(() => {
    const ret = [];
    let lastPlacement: number | null = null;
    for (const comment of comments) {
      const placement: number | null = comment.excluded
        ? null
        : (lastPlacement ?? 0) + 1;
      lastPlacement = placement ?? lastPlacement;
      ret.push({
        ...comment,
        placement,
      });
    }
    return ret;
  }, [comments]);

  return (
    <div className="mx-auto max-w-4xl px-1.5 md:px-0">
      <div className="mb-6 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center md:gap-4">
        <h1 className="mt-2 text-balance text-2xl font-bold text-blue-800 dark:text-blue-800-dark md:mt-1.5 md:block md:text-3xl">
          {t("weeklyTopComments")}
        </h1>
        <WeekSelector
          weekStart={weekStart}
          className="w-full md:w-fit"
          onWeekChange={onWeekChange}
        />
      </div>

      <p className="mb-5 text-sm leading-relaxed text-gray-700 dark:text-gray-700-dark">
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

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingIndicator className="h-8 w-8 text-blue-600 dark:text-blue-600-dark" />
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="space-y-4 pb-8">
          {commentsWithPlacements.map((comment, index) => (
            <HighlightedCommentCard
              key={comment.id}
              comment={comment}
              placement={comment.placement}
              currentUser={currentUser}
              onExcludeToggleFinished={onExcludeToggleFinished}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsOfWeekContent;
