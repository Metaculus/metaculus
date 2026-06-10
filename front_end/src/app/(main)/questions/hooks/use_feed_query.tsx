"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Options } from "nuqs";
import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiltersFromSearchParamsOptions,
  generateFiltersFromSearchParams,
} from "@/app/(main)/questions/helpers/filters";
import {
  FEED_FILTER_QUERY_OPTIONS,
  FEED_PAGE_QUERY_OPTIONS,
  FEED_SEARCH_QUERY_OPTIONS,
  setSearchParamValue,
  useFeedQueryParams,
} from "@/app/(main)/questions/hooks/use_feed_query_params";
import {
  FeedType,
  POST_CATEGORIES_FILTER,
  POST_COMMUNITIES_FILTER,
  POST_COMMENTS_FEED_FILTER,
  POST_FOLLOWING_FILTER,
  POST_FORECASTER_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_TEXT_SEARCH_FILTER,
  POST_TOPIC_FILTER,
  POST_USERNAMES_FILTER,
  POST_WEEKLY_TOP_COMMENTS_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import { PostsParams } from "@/services/api/posts/posts.shared";
import { QuestionOrder } from "@/types/question";
import { urlSearchParamsToRecord } from "@/utils/navigation";

type FeedResultCount = {
  count: number;
  isLowerBound?: boolean;
};

type FeedQueryContextValue = {
  params: URLSearchParams;
  filters: PostsParams;
  resultCount?: FeedResultCount;
  currentFeed: FeedType | null;
  clearInReview: () => void;
  getFeedUrl: (feed: FeedType) => string;
  setResultCount: (count: FeedResultCount | undefined) => void;
  setFilterParams: (params: URLSearchParams) => void;
  setPageParams: (params: URLSearchParams) => void;
  setSearchParams: (params: URLSearchParams) => void;
  switchFeed: (feed: FeedType) => void;
};

const FeedQueryContext = createContext<FeedQueryContextValue | null>(null);

function getSearchParamsSignature(params: URLSearchParams) {
  return Array.from(params.entries())
    .sort(([keyA, valueA], [keyB, valueB]) => {
      const keyCompare = keyA.localeCompare(keyB);
      return keyCompare || valueA.localeCompare(valueB);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

type Props = PropsWithChildren<{
  filterOptions?: FiltersFromSearchParamsOptions;
  filterUpdateOptions?: Options;
}>;

export const FeedQueryProvider: FC<Props> = ({
  children,
  filterOptions,
  filterUpdateOptions = FEED_FILTER_QUERY_OPTIONS,
}) => {
  const { setParams: setUrlParams } = useFeedQueryParams();
  const nextSearchParams = useSearchParams();
  const nextSearchParamsString = nextSearchParams.toString();
  const nextUrlParams = useMemo(
    () => new URLSearchParams(nextSearchParamsString),
    [nextSearchParamsString]
  );
  const nextUrlParamsSignature = useMemo(
    () => getSearchParamsSignature(nextUrlParams),
    [nextUrlParams]
  );
  const [params, setOptimisticParams] = useState(() => nextUrlParams);
  const [resultCount, setResultCount] = useState<FeedResultCount | undefined>();
  const pendingUrlSignature = useRef<string | null>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    pendingUrlSignature.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptimisticParams((currentParams) =>
      getSearchParamsSignature(currentParams) === nextUrlParamsSignature
        ? currentParams
        : new URLSearchParams(nextUrlParams)
    );
  }, [nextUrlParams, nextUrlParamsSignature]);

  const selectedTopic = params.get(POST_TOPIC_FILTER);
  const selectedCategory = params.get(POST_CATEGORIES_FILTER);
  const selectedSearch = params.get(POST_TEXT_SEARCH_FILTER);
  const guessedById = params.get(POST_FORECASTER_ID_FILTER);
  const authorUsernames = params.getAll(POST_USERNAMES_FILTER);
  const following = params.get(POST_FOLLOWING_FILTER);
  const orderBy = params.get(POST_ORDER_BY_FILTER);
  const communities = params.get(POST_COMMUNITIES_FILTER);
  const weeklyTopComments = params.get(POST_WEEKLY_TOP_COMMENTS_FILTER);
  const commentsFeed = params.get(POST_COMMENTS_FEED_FILTER);

  const filters = useMemo(
    () =>
      generateFiltersFromSearchParams(
        urlSearchParamsToRecord(params),
        filterOptions
      ),
    [filterOptions, params]
  );

  const currentFeed = useMemo(() => {
    if (selectedSearch) return null;
    if (selectedTopic || selectedCategory) return null;
    if (guessedById) return FeedType.MY_PREDICTIONS;
    if (following) return FeedType.FOLLOWING;

    if (
      user &&
      authorUsernames.length &&
      authorUsernames[0] === user.username
    ) {
      return FeedType.MY_QUESTIONS_AND_POSTS;
    }
    if (communities) return FeedType.COMMUNITIES;
    if (weeklyTopComments) return FeedType.WEEKLY_TOP_COMMENTS;
    if (commentsFeed) return FeedType.COMMENTS_FEED;

    return FeedType.HOME;
  }, [
    authorUsernames,
    commentsFeed,
    communities,
    following,
    guessedById,
    selectedCategory,
    selectedSearch,
    selectedTopic,
    user,
    weeklyTopComments,
  ]);

  const getParamsForFeed = useCallback(
    (feed: FeedType): Record<string, string> => {
      switch (feed) {
        case FeedType.MY_PREDICTIONS:
          if (!user) return {};
          return {
            [POST_FORECASTER_ID_FILTER]: user.id.toString(),
            [POST_ORDER_BY_FILTER]: QuestionOrder.WeeklyMovementDesc,
          };
        case FeedType.MY_QUESTIONS_AND_POSTS:
          if (!user) return {};
          return {
            [POST_USERNAMES_FILTER]: user.username,
          };
        case FeedType.COMMUNITIES:
          return { [POST_COMMUNITIES_FILTER]: "true" };
        case FeedType.WEEKLY_TOP_COMMENTS:
          return { [POST_WEEKLY_TOP_COMMENTS_FILTER]: "true" };
        case FeedType.COMMENTS_FEED:
          return { [POST_COMMENTS_FEED_FILTER]: "true" };
        case FeedType.FOLLOWING:
          return { [POST_FOLLOWING_FILTER]: "true" };
        case FeedType.HOME:
        default:
          return {};
      }
    },
    [user]
  );

  const getFeedUrl = useCallback(
    (feed: FeedType): string => {
      const feedParams = getParamsForFeed(feed);
      const queryString = new URLSearchParams(feedParams).toString();
      return `${pathname}${queryString ? `?${queryString}` : ""}`;
    },
    [getParamsForFeed, pathname]
  );

  const commitParams = useCallback(
    (nextParams: URLSearchParams, options: Options) => {
      pendingUrlSignature.current = getSearchParamsSignature(nextParams);
      setOptimisticParams(new URLSearchParams(nextParams));
      void setUrlParams(nextParams, options);
    },
    [setUrlParams]
  );

  const clearInReview = useCallback(() => {
    if (orderBy !== QuestionOrder.VotesDesc) return;

    const nextParams = new URLSearchParams(params);
    nextParams.delete(POST_ORDER_BY_FILTER);

    commitParams(nextParams, filterUpdateOptions);
  }, [commitParams, filterUpdateOptions, orderBy, params]);

  const setFilterParams = useCallback(
    (nextParams: URLSearchParams) => {
      commitParams(nextParams, filterUpdateOptions);
    },
    [commitParams, filterUpdateOptions]
  );

  const setPageParams = useCallback(
    (nextParams: URLSearchParams) => {
      commitParams(nextParams, FEED_PAGE_QUERY_OPTIONS);
    },
    [commitParams]
  );

  const setSearchParams = useCallback(
    (nextParams: URLSearchParams) => {
      commitParams(nextParams, FEED_SEARCH_QUERY_OPTIONS);
    },
    [commitParams]
  );

  const switchFeed = useCallback(
    (feed: FeedType) => {
      const nextParams = new URLSearchParams();

      Object.entries(getParamsForFeed(feed)).forEach(([key, value]) => {
        setSearchParamValue(nextParams, key, value);
      });
      commitParams(nextParams, filterUpdateOptions);
    },
    [commitParams, filterUpdateOptions, getParamsForFeed]
  );

  const value = useMemo(
    () => ({
      params,
      filters,
      resultCount,
      currentFeed,
      clearInReview,
      getFeedUrl,
      setResultCount,
      setFilterParams,
      setPageParams,
      setSearchParams,
      switchFeed,
    }),
    [
      params,
      filters,
      resultCount,
      currentFeed,
      clearInReview,
      getFeedUrl,
      setResultCount,
      setFilterParams,
      setPageParams,
      setSearchParams,
      switchFeed,
    ]
  );

  return (
    <FeedQueryContext.Provider value={value}>
      {children}
    </FeedQueryContext.Provider>
  );
};

export function useFeedQuery() {
  const context = useContext(FeedQueryContext);
  if (!context) {
    throw new Error("useFeedQuery must be used within FeedQueryProvider");
  }

  return context;
}
