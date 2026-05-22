import {
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import ClientPostsApi from "@/services/api/posts/posts.client";
import {
  PostFetchParams,
  PostsParams,
} from "@/services/api/posts/posts.shared";
import ClientProjectsApi from "@/services/api/projects/projects.client";
import { CountlessPaginatedPayload } from "@/types/fetch";
import { PostWithForecasts } from "@/types/post";
import { FeedProjectTile } from "@/types/projects";

export const POSTS_FEED_STALE_TIME = 60 * 1000;
export const POSTS_FEED_GC_TIME = 10 * 60 * 1000;

type PostsFeedPage = CountlessPaginatedPayload<PostWithForecasts>;
type PostsFeedInfiniteData = InfiniteData<PostsFeedPage, number>;
type PostsFeedFilters = Omit<PostsParams, "limit" | "offset" | "page">;
type PostsFeedFetchParams = Required<
  Pick<PostFetchParams, "include_cp_history">
>;

const PAGINATION_FILTER_KEYS = new Set<keyof PostsParams>([
  "limit",
  "offset",
  "page",
]);

function sortParamValue(value: string[] | number[]) {
  return [...value].sort((a, b) => String(a).localeCompare(String(b)));
}

export function normalizePostsFeedFilters(
  filters: PostsParams
): PostsFeedFilters {
  const normalizedEntries: [string, unknown][] = [];

  for (const [key, value] of Object.entries(filters) as [
    keyof PostsParams,
    PostsParams[keyof PostsParams],
  ][]) {
    if (PAGINATION_FILTER_KEYS.has(key) || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      if (value.length) {
        normalizedEntries.push([key, sortParamValue(value)]);
      }
      continue;
    }

    normalizedEntries.push([key, value]);
  }

  normalizedEntries.sort(([a], [b]) => a.localeCompare(b));

  return Object.fromEntries(normalizedEntries) as PostsFeedFilters;
}

export function normalizePostsFeedFetchParams(
  fetchParams?: PostFetchParams
): PostsFeedFetchParams {
  return {
    include_cp_history: fetchParams?.include_cp_history ?? true,
  };
}

function getNextPostsFeedOffset(
  lastPage: PostsFeedPage,
  allPages: PostsFeedPage[],
  pageSize: number
) {
  if (!lastPage.next || lastPage.results.length < pageSize) {
    return undefined;
  }

  return allPages.reduce((sum, page) => sum + page.results.length, 0);
}

function createInitialPostsFeedData(
  posts: PostWithForecasts[],
  pageSize: number,
  count = Number.POSITIVE_INFINITY
): PostsFeedInfiniteData {
  return {
    pageParams: [0],
    pages: [
      {
        count,
        next: posts.length >= pageSize ? "initial-next-page" : null,
        previous: null,
        results: posts,
      },
    ],
  };
}

export const postsFeedKeys = {
  all: ["posts-feed"] as const,
  lists: () => [...postsFeedKeys.all, "list"] as const,
  list: (
    filters: PostsParams,
    fetchParams?: PostFetchParams,
    pageSize = POSTS_PER_PAGE
  ): QueryKey =>
    [
      ...postsFeedKeys.lists(),
      normalizePostsFeedFilters(filters),
      normalizePostsFeedFetchParams(fetchParams),
      { pageSize },
    ] as const,
  tiles: () => [...postsFeedKeys.all, "tiles"] as const,
};

type UsePostsFeedQueryParams = {
  filters: PostsParams;
  fetchParams?: PostFetchParams;
  pageSize?: number;
  enabled?: boolean;
  initialPosts?: PostWithForecasts[];
  initialCount?: number;
};

export function usePostsFeedQuery({
  filters,
  fetchParams,
  pageSize = POSTS_PER_PAGE,
  enabled = true,
  initialPosts,
  initialCount,
}: UsePostsFeedQueryParams) {
  const queryClient = useQueryClient();
  const normalizedFilters = useMemo(
    () => normalizePostsFeedFilters(filters),
    [filters]
  );
  const normalizedFetchParams = useMemo(
    () => normalizePostsFeedFetchParams(fetchParams),
    [fetchParams]
  );
  const queryKey = useMemo(
    () =>
      postsFeedKeys.list(normalizedFilters, normalizedFetchParams, pageSize),
    [normalizedFilters, normalizedFetchParams, pageSize]
  );

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      ClientPostsApi.getPostsWithCP(
        {
          ...normalizedFilters,
          offset: pageParam,
          limit: pageSize,
        },
        normalizedFetchParams
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      getNextPostsFeedOffset(lastPage, allPages, pageSize),
    enabled,
    staleTime: POSTS_FEED_STALE_TIME,
    gcTime: POSTS_FEED_GC_TIME,
    initialData: initialPosts
      ? createInitialPostsFeedData(initialPosts, pageSize, initialCount)
      : undefined,
  });

  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data]
  );
  const pageCount = query.data?.pages[0]?.count;
  const totalCount =
    typeof pageCount === "number" && Number.isFinite(pageCount)
      ? pageCount
      : undefined;

  useEffect(() => {
    if (!initialPosts || initialPosts.length <= posts.length) {
      return;
    }

    queryClient.setQueryData<PostsFeedInfiniteData>(
      queryKey,
      createInitialPostsFeedData(initialPosts, pageSize, initialCount)
    );
  }, [
    initialCount,
    initialPosts,
    pageSize,
    posts.length,
    queryClient,
    queryKey,
  ]);

  return {
    ...query,
    posts,
    loadedCount: posts.length,
    totalCount,
  };
}

type UseFeedProjectTilesQueryParams = {
  enabled?: boolean;
  initialTiles?: FeedProjectTile[];
};

export function useFeedProjectTilesQuery({
  enabled = true,
  initialTiles,
}: UseFeedProjectTilesQueryParams = {}) {
  return useQuery({
    queryKey: postsFeedKeys.tiles(),
    queryFn: () => ClientProjectsApi.getFeedTiles(),
    enabled,
    staleTime: POSTS_FEED_STALE_TIME,
    gcTime: POSTS_FEED_GC_TIME,
    initialData: initialTiles,
  });
}

export function invalidatePostsFeedQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: postsFeedKeys.lists() });
}

export function setPostInPostsFeedQueries(
  queryClient: QueryClient,
  postId: number,
  updater: (post: PostWithForecasts) => PostWithForecasts
) {
  queryClient.setQueriesData<PostsFeedInfiniteData>(
    { queryKey: postsFeedKeys.lists() },
    (data) => {
      if (!data) {
        return data;
      }

      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          results: page.results.map((post) =>
            post.id === postId ? updater(post) : post
          ),
        })),
      };
    }
  );
}
