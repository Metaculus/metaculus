"use client";

import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useRef, useState } from "react";

import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { getCommentsParams } from "@/services/api/comments/comments.shared";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";

import CommentFeedCard from "./comment_feed_card";

const COMMENTS_PER_PAGE = 10;

type SortOption = "-created_at" | "-vote_score" | "-cmm_count" | "relevance";

type TimeWindow = "all_time" | "past_week" | "past_month" | "past_year";

const CommentsFeedContent: FC = () => {
  const t = useTranslations();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [postsMap, setPostsMap] = useState<Record<number, PostWithForecasts>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<SortOption>("-created_at");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all_time");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Use refs to avoid stale closures in fetchComments
  const commentsRef = useRef(comments);
  commentsRef.current = comments;
  const postsMapRef = useRef(postsMap);
  postsMapRef.current = postsMap;

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value.length >= 3 ? value : "");
    }, 300);
  }, []);

  const fetchComments = useCallback(
    async (offset: number, reset: boolean = false) => {
      setIsLoading(true);
      try {
        const params: getCommentsParams = {
          limit: COMMENTS_PER_PAGE,
          offset,
          sort,
          ...(timeWindow !== "all_time" && { time_window: timeWindow }),
          ...(debouncedSearch && { search: debouncedSearch }),
        };
        const response = await ClientCommentsApi.getComments(params);
        const prev = reset ? [] : commentsRef.current;
        const newComments = [...prev, ...response.results];
        setComments(newComments);
        setHasMore(!!response.next);

        // Fetch posts for new comments
        const currentPostsMap = postsMapRef.current;
        const newPostIds = [
          ...new Set(
            response.results
              .map((c) => c.on_post)
              .filter(
                (id): id is number => id != null && !(id in currentPostsMap)
              )
          ),
        ];
        if (newPostIds.length > 0) {
          const postsResponse = await ClientPostsApi.getPostsWithCP(
            { ids: newPostIds },
            { include_cp_history: false }
          );
          const updatedPostsMap = { ...currentPostsMap };
          for (const post of postsResponse.results) {
            updatedPostsMap[post.id] = post;
          }
          setPostsMap(updatedPostsMap);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [sort, timeWindow, debouncedSearch]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setComments([]);
    setHasMore(true);
    fetchComments(0, true);
  }, [fetchComments]);

  // Auto-switch to relevance sort when searching
  useEffect(() => {
    if (debouncedSearch && sort !== "relevance") {
      setSort("relevance");
    } else if (!debouncedSearch && sort === "relevance") {
      setSort("-created_at");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const handleLoadMore = () => {
    fetchComments(comments.length);
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "-created_at", label: t("sortRecent") },
    { value: "-vote_score", label: t("sortMostUpvoted") },
    { value: "-cmm_count", label: t("sortMostMindsChanged") },
    ...(debouncedSearch
      ? [
          {
            value: "relevance" as SortOption,
            label: t("sortRelevance"),
          },
        ]
      : []),
  ];

  const timeWindowOptions: { value: TimeWindow; label: string }[] = [
    { value: "all_time", label: t("timeWindowAllTime") },
    { value: "past_week", label: t("timeWindowPastWeek") },
    { value: "past_month", label: t("timeWindowPastMonth") },
    { value: "past_year", label: t("timeWindowPastYear") },
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <h1 className="mt-2 text-balance text-2xl font-bold text-blue-800 dark:text-blue-800-dark md:mt-1.5 md:block md:text-3xl">
        {t("commentsFeedTitle")}
      </h1>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded border border-gray-400 bg-gray-0 px-3 py-1.5 text-sm dark:border-gray-400-dark dark:bg-gray-0-dark"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={timeWindow}
          onChange={(e) => setTimeWindow(e.target.value as TimeWindow)}
          className="rounded border border-gray-400 bg-gray-0 px-3 py-1.5 text-sm dark:border-gray-400-dark dark:bg-gray-0-dark"
        >
          {timeWindowOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("searchComments")}
          className="min-w-[200px] flex-1 rounded border border-gray-400 bg-gray-0 px-3 py-1.5 text-sm dark:border-gray-400-dark dark:bg-gray-0-dark"
        />
      </div>

      {/* Comments list */}
      {comments.map((comment) => (
        <CommentFeedCard
          key={comment.id}
          comment={comment}
          post={comment.on_post ? postsMap[comment.on_post] : undefined}
        />
      ))}

      {/* Loading / empty / load more states */}
      {isLoading && <LoadingIndicator />}
      {!isLoading && comments.length === 0 && (
        <p className="py-8 text-center text-gray-500 dark:text-gray-500-dark">
          {t("noCommentsFound")}
        </p>
      )}
      {!isLoading && hasMore && comments.length > 0 && (
        <div className="flex justify-center py-4">
          <Button onClick={handleLoadMore}>{t("loadMoreComments")}</Button>
        </div>
      )}
    </div>
  );
};

export default CommentsFeedContent;
