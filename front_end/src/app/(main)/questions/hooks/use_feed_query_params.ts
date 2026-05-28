"use client";

import {
  parseAsInteger,
  parseAsNativeArrayOf,
  parseAsString,
  useQueryStates,
} from "nuqs";
import type { Options, Values } from "nuqs";
import { useCallback, useMemo } from "react";

import {
  POST_ACCESS_FILTER,
  POST_AUTHOR_FILTER,
  POST_CATEGORIES_FILTER,
  POST_COMMENTED_BY_FILTER,
  POST_COMMUNITIES_FILTER,
  POST_COMMENTS_FEED_FILTER,
  POST_FOLLOWING_FILTER,
  POST_FORECASTER_ID_FILTER,
  POST_FOR_MAIN_FEED,
  POST_IDS_FILTER,
  POST_LEADERBOARD_TAGS_FILTER,
  POST_NOT_FORECASTER_ID_FILTER,
  POST_ORDER_BY_FILTER,
  POST_PAGE_FILTER,
  POST_PROJECT_FILTER,
  POST_STATUS_FILTER,
  POST_TEXT_SEARCH_FILTER,
  POST_TOPIC_FILTER,
  POST_TYPE_FILTER,
  POST_UPVOTED_BY_FILTER,
  POST_USERNAMES_FILTER,
  POST_WEEKLY_TOP_COMMENTS_FILTER,
  POST_WITHDRAWN_FILTER,
} from "@/constants/posts_feed";

const multiStringParser = parseAsNativeArrayOf(parseAsString);

const feedQueryParsers = {
  [POST_ACCESS_FILTER]: parseAsString,
  [POST_AUTHOR_FILTER]: parseAsString,
  [POST_CATEGORIES_FILTER]: multiStringParser,
  [POST_COMMENTED_BY_FILTER]: parseAsString,
  [POST_COMMUNITIES_FILTER]: parseAsString,
  [POST_COMMENTS_FEED_FILTER]: parseAsString,
  [POST_FOLLOWING_FILTER]: parseAsString,
  [POST_FORECASTER_ID_FILTER]: parseAsString,
  [POST_FOR_MAIN_FEED]: parseAsString,
  [POST_IDS_FILTER]: multiStringParser,
  [POST_LEADERBOARD_TAGS_FILTER]: multiStringParser,
  [POST_NOT_FORECASTER_ID_FILTER]: parseAsString,
  [POST_ORDER_BY_FILTER]: parseAsString,
  [POST_PAGE_FILTER]: parseAsInteger,
  [POST_PROJECT_FILTER]: parseAsString,
  [POST_STATUS_FILTER]: multiStringParser,
  [POST_TEXT_SEARCH_FILTER]: parseAsString,
  [POST_TOPIC_FILTER]: parseAsString,
  [POST_TYPE_FILTER]: multiStringParser,
  [POST_UPVOTED_BY_FILTER]: parseAsString,
  [POST_USERNAMES_FILTER]: multiStringParser,
  [POST_WEEKLY_TOP_COMMENTS_FILTER]: parseAsString,
  [POST_WITHDRAWN_FILTER]: parseAsString,
};

export type FeedQueryState = Values<typeof feedQueryParsers>;

export const FEED_FILTER_QUERY_OPTIONS: Options = {
  history: "push",
  scroll: true,
  shallow: true,
};

export const FEED_SEARCH_QUERY_OPTIONS: Options = {
  history: "replace",
  scroll: true,
  shallow: true,
};

export const FEED_PAGE_QUERY_OPTIONS: Options = {
  history: "replace",
  scroll: false,
  shallow: true,
};

const multiValueKeys = new Set<string>([
  POST_CATEGORIES_FILTER,
  POST_IDS_FILTER,
  POST_LEADERBOARD_TAGS_FILTER,
  POST_STATUS_FILTER,
  POST_TYPE_FILTER,
  POST_USERNAMES_FILTER,
]);

function appendParam(
  params: URLSearchParams,
  key: string,
  value: string | number | string[] | null
) {
  if (value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      params.append(key, item);
    }
    return;
  }

  params.set(key, String(value));
}

function feedQueryStateToSearchParams(state: FeedQueryState) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(state)) {
    appendParam(params, key, value);
  }

  return params;
}

function searchParamsToFeedQueryState(params: URLSearchParams): FeedQueryState {
  return Object.fromEntries(
    Object.keys(feedQueryParsers).map((key) => {
      if (multiValueKeys.has(key)) {
        return [key, params.getAll(key)];
      }

      if (key === POST_PAGE_FILTER) {
        const value = params.get(key);
        return [key, value ? Number(value) : null];
      }

      return [key, params.get(key)];
    })
  ) as FeedQueryState;
}

export function setSearchParamValue(
  params: URLSearchParams,
  name: string,
  value: string | string[]
) {
  params.delete(name);

  if (Array.isArray(value)) {
    for (const item of value) {
      params.append(name, item);
    }
    return;
  }

  params.set(name, value);
}

export function deleteSearchParamValue(
  params: URLSearchParams,
  name: string,
  value?: string
) {
  if (value) {
    params.delete(name, value);
    return;
  }

  params.delete(name);
}

export function useFeedQueryParams() {
  const [state, setState] = useQueryStates(feedQueryParsers, {
    shallow: true,
  });

  const params = useMemo(() => feedQueryStateToSearchParams(state), [state]);

  const setParams = useCallback(
    (
      nextParams: URLSearchParams,
      options: Options = FEED_FILTER_QUERY_OPTIONS
    ) => setState(searchParamsToFeedQueryState(nextParams), options),
    [setState]
  );

  return {
    params,
    setParams,
    state,
  };
}
