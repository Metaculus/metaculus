"use client";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { FC, useCallback, useMemo, useState } from "react";

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
import useSearchParams from "@/hooks/use_search_params";
import ClientCommentsApi from "@/services/api/comments/comments.client";
import { getCommentsParams } from "@/services/api/comments/comments.shared";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostStatus, PostWithForecasts } from "@/types/post";

import CommentFeedCard from "./comment_feed_card";

const COMMENTS_PER_PAGE = 10;

const SORT_PARAM = "sort";
const TIME_WINDOW_PARAM = "time";
const SEARCH_PARAM = "search";
const EXCLUDE_BOTS_PARAM = "exclude_bots";

type SortOption =
  | "-created_at"
  | "-vote_score"
  | "-cmm_count"
  | "-key_factor_votes_score"
  | "relevance";

type TimeWindow = "all_time" | "past_week" | "past_month" | "past_year";

const VALID_SORTS: SortOption[] = [
  "-created_at",
  "-vote_score",
  "-cmm_count",
  "-key_factor_votes_score",
  "relevance",
];
const VALID_TIME_WINDOWS: TimeWindow[] = [
  "all_time",
  "past_week",
  "past_month",
  "past_year",
];

const CommentFeedContent: FC = () => {
  const t = useTranslations();
  const { params, setParam, deleteParam, replaceUrlWithoutNavigation } =
    useSearchParams();

  const initialSort = VALID_SORTS.includes(params.get(SORT_PARAM) as SortOption)
    ? (params.get(SORT_PARAM) as SortOption)
    : "-created_at";
  const initialTimeWindow = VALID_TIME_WINDOWS.includes(
    params.get(TIME_WINDOW_PARAM) as TimeWindow
  )
    ? (params.get(TIME_WINDOW_PARAM) as TimeWindow)
    : "all_time";
  const initialSearch = params.get(SEARCH_PARAM) ?? "";
  const initialExcludeBots = params.get(EXCLUDE_BOTS_PARAM) !== "false";

  const [sort, setSort] = useState<SortOption>(initialSort);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(initialTimeWindow);
  const [excludeBots, setExcludeBots] = useState(initialExcludeBots);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  const syncUrlParams = useCallback(
    (
      newSort: SortOption,
      newTimeWindow: TimeWindow,
      newSearch: string,
      newExcludeBots: boolean
    ) => {
      if (newSort !== "-created_at") {
        setParam(SORT_PARAM, newSort, false);
      } else {
        deleteParam(SORT_PARAM, false);
      }
      if (newTimeWindow !== "all_time") {
        setParam(TIME_WINDOW_PARAM, newTimeWindow, false);
      } else {
        deleteParam(TIME_WINDOW_PARAM, false);
      }
      if (newSearch) {
        setParam(SEARCH_PARAM, newSearch, false);
      } else {
        deleteParam(SEARCH_PARAM, false);
      }
      if (!newExcludeBots) {
        setParam(EXCLUDE_BOTS_PARAM, "false", false);
      } else {
        deleteParam(EXCLUDE_BOTS_PARAM, false);
      }
      replaceUrlWithoutNavigation();
    },
    [setParam, deleteParam, replaceUrlWithoutNavigation]
  );

  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    const newSearch = value.length >= 3 ? value : "";
    setDebouncedSearch(newSearch);
    if (newSearch) {
      setSort("relevance");
      syncUrlParams("relevance", timeWindow, newSearch, excludeBots);
    } else {
      setSort("-created_at");
      syncUrlParams("-created_at", timeWindow, "", excludeBots);
    }
  }, 500);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      updateDebouncedSearch(value);
    },
    [updateDebouncedSearch]
  );

  const effectiveSort =
    sort === "relevance" && !debouncedSearch ? "-created_at" : sort;

  const {
    data: commentsData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      "comments-feed",
      effectiveSort,
      timeWindow,
      debouncedSearch,
      excludeBots,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const params: getCommentsParams = {
        limit: COMMENTS_PER_PAGE,
        offset: pageParam,
        sort: effectiveSort,
        is_private: false,
        include_deleted: false,
        post_status: PostStatus.APPROVED,
        ...(timeWindow !== "all_time" && { time_window: timeWindow }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(!debouncedSearch && { exclude_bots_only_project: true }),
        exclude_bots: excludeBots,
      };
      return ClientCommentsApi.getComments(params);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.results.length < COMMENTS_PER_PAGE) return undefined;
      return allPages.reduce((sum, page) => sum + page.results.length, 0);
    },
    gcTime: 0,
  });

  const comments = useMemo(
    () => commentsData?.pages.flatMap((page) => page.results) ?? [],
    [commentsData]
  );

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

  const queryClient = useQueryClient();
  const postsStableKey = ["comments-feed-posts"];
  const { data: postsMap = {} } = useQuery({
    queryKey: [...postsStableKey, postIds],
    queryFn: async () => {
      const cached =
        queryClient.getQueryData<Record<number, PostWithForecasts>>(
          postsStableKey
        ) ?? {};
      const missingIds = postIds.filter((id) => !(id in cached));
      if (missingIds.length === 0) return cached;

      const response = await ClientPostsApi.getPostsWithCP(
        { ids: missingIds },
        { include_cp_history: false }
      );
      const fetched: Record<number, PostWithForecasts> = {};
      for (const post of response.results) {
        fetched[post.id] = post;
      }
      // Atomic merge against latest cache snapshot
      queryClient.setQueryData<Record<number, PostWithForecasts>>(
        postsStableKey,
        (old) => ({ ...(old ?? {}), ...fetched })
      );
      return {
        ...(queryClient.getQueryData<Record<number, PostWithForecasts>>(
          postsStableKey
        ) ?? {}),
      };
    },
    enabled: postIds.length > 0,
    placeholderData: (prev) => prev,
  });

  const sortOptions: {
    value: SortOption;
    label: string;
    className?: string;
  }[] = [
    { value: "-created_at", label: t("sortRecent") },
    { value: "-vote_score", label: t("sortMostUpvoted") },
    { value: "-cmm_count", label: t("sortMostMindsChanged") },
    {
      value: "-key_factor_votes_score",
      label: t("keyFactorImpact"),
      className: "capitalize",
    },
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
      const newTimeWindow = (optionValue as TimeWindow) ?? "all_time";
      setTimeWindow(newTimeWindow);
      syncUrlParams(sort, newTimeWindow, debouncedSearch, excludeBots);
    } else if (filterId === "exclude_bots") {
      const newExcludeBots = optionValue === "true";
      setExcludeBots(newExcludeBots);
      syncUrlParams(sort, timeWindow, debouncedSearch, newExcludeBots);
    }
  };

  const handlePopoverFilterClear = () => {
    setTimeWindow("all_time");
    setExcludeBots(true);
    syncUrlParams(sort, "all_time", debouncedSearch, true);
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
          <Listbox
            value={sort}
            onChange={(value: SortOption) => {
              setSort(value);
              syncUrlParams(value, timeWindow, debouncedSearch, excludeBots);
            }}
            options={sortOptions}
          />
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
      {hasNextPage && comments.length > 0 && (
        <div className="flex py-5">
          {isFetchingNextPage ? (
            <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
          ) : (
            <Button className="mx-auto" onClick={() => fetchNextPage()}>
              {t("loadMoreComments")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentFeedContent;
