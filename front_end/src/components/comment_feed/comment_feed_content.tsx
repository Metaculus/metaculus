"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

import PopoverFilter from "@/components/popover_filter";
import {
  FilterOptionType,
  FilterSection,
} from "@/components/popover_filter/types";
import SearchInput from "@/components/search_input";
import Button from "@/components/ui/button";
import Listbox from "@/components/ui/listbox";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { getCommentsParams } from "@/services/api/comments/comments.shared";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { CommentType } from "@/types/comment";
import { PostStatus, PostWithForecasts } from "@/types/post";

import CommentFeedCard from "./comment_feed_card";

const COMMENTS_PER_PAGE = 10;

type SortOption = "-created_at" | "-vote_score" | "-cmm_count" | "relevance";

type TimeWindow = "all_time" | "past_week" | "past_month" | "past_year";

const CommentFeedContent: FC = () => {
  const t = useTranslations();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [sort, setSort] = useState<SortOption>("-created_at");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all_time");
  const [excludeBots, setExcludeBots] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value.length >= 3 ? value : "");
  }, 500);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      updateDebouncedSearch(value);
    },
    [updateDebouncedSearch]
  );

  // Use ref to avoid stale closure in fetchComments
  const commentsRef = useRef(comments);
  commentsRef.current = comments;

  const postIds = useMemo(
    () =>
      [
        ...new Set(
          comments
            .map((c) => c.on_post)
            .filter((id): id is number => id != null)
        ),
      ].sort(),
    [comments]
  );

  const { data: postsMap = {} } = useQuery({
    queryKey: ["comments-feed-posts", postIds],
    queryFn: async () => {
      const response = await ClientPostsApi.getPostsWithCP(
        { ids: postIds },
        { include_cp_history: false }
      );
      const map: Record<number, PostWithForecasts> = {};
      for (const post of response.results) {
        map[post.id] = post;
      }
      return map;
    },
    enabled: postIds.length > 0,
    placeholderData: keepPreviousData,
  });

  const fetchComments = useCallback(
    async (offset: number, reset: boolean = false) => {
      setIsLoading(true);
      try {
        const effectiveSort =
          sort === "relevance" && !debouncedSearch ? "-created_at" : sort;
        const params: getCommentsParams = {
          limit: COMMENTS_PER_PAGE,
          offset,
          sort: effectiveSort,
          parent_isnull: true,
          is_private: false,
          include_deleted: false,
          post_status: PostStatus.APPROVED,
          ...(timeWindow !== "all_time" && { time_window: timeWindow }),
          ...(debouncedSearch && { search: debouncedSearch }),
          exclude_bots: excludeBots,
        };
        const response = await ClientCommentsApi.getComments(params);
        const prev = reset ? [] : commentsRef.current;
        const newComments = [...prev, ...response.results];
        setComments(newComments);
        setHasMore(response.results.length >= COMMENTS_PER_PAGE);
      } finally {
        setIsLoading(false);
      }
    },
    [sort, timeWindow, debouncedSearch, excludeBots]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setComments([]);
    setHasMore(true);
    void fetchComments(0, true);
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
    void fetchComments(comments.length);
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

  const popoverFilters: FilterSection[] = [
    {
      id: "time_window",
      title: t("timeWindow"),
      type: FilterOptionType.ToggleChip,
      options: [
        {
          label: t("timeWindowAllTime"),
          value: "all_time",
          active: timeWindow === "all_time",
        },
        {
          label: t("timeWindowPastWeek"),
          value: "past_week",
          active: timeWindow === "past_week",
        },
        {
          label: t("timeWindowPastMonth"),
          value: "past_month",
          active: timeWindow === "past_month",
        },
        {
          label: t("timeWindowPastYear"),
          value: "past_year",
          active: timeWindow === "past_year",
        },
      ],
    },
    {
      id: "exclude_bots",
      title: t("bots"),
      type: FilterOptionType.ToggleChip,
      options: [
        { label: t("excludeBots"), value: "true", active: excludeBots },
        { label: t("includeBots"), value: "false", active: !excludeBots },
      ],
    },
  ];

  const handlePopoverFilterChange = (
    filterId: string,
    optionValue: string | string[] | null
  ) => {
    if (filterId === "time_window") {
      setTimeWindow((optionValue as TimeWindow) ?? "all_time");
    } else if (filterId === "exclude_bots") {
      setExcludeBots(optionValue === "true");
    }
  };

  const handlePopoverFilterClear = () => {
    setTimeWindow("all_time");
    setExcludeBots(true);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <h1 className="mt-2 text-balance text-2xl font-bold text-blue-800 dark:text-blue-800-dark md:mt-1.5 md:block md:text-3xl">
        {t("commentsFeedTitle")}
      </h1>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onErase={() => handleSearchChange("")}
          placeholder={t("searchComments")}
          iconPosition="left"
          className="w-full sm:w-auto sm:min-w-[240px] sm:flex-1"
        />
        <div className="ml-auto flex gap-3 md:ml-0">
          <Listbox value={sort} onChange={setSort} options={sortOptions} />
          <PopoverFilter
            filters={popoverFilters}
            onChange={handlePopoverFilterChange}
            onClear={handlePopoverFilterClear}
            panelClassName="w-[300px]"
            fullScreenEnabled
          />
        </div>
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
      {isLoading && comments.length === 0 && (
        <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
      )}
      {!isLoading && comments.length === 0 && (
        <p className="py-8 text-center text-gray-500 dark:text-gray-500-dark">
          {t("noCommentsFound")}
        </p>
      )}
      {hasMore && comments.length > 0 && (
        <div className="flex py-5">
          {isLoading ? (
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          ) : (
            <Button className="mx-auto" onClick={handleLoadMore}>
              {t("loadMoreComments")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentFeedContent;
