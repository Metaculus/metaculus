import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostWithForecasts } from "@/types/post";

export function useOnboardingFeed(isOpen: boolean) {
  const {
    data,
    isLoading,
    isError: fetchError,
    refetch,
  } = useQuery({
    queryKey: ["onboarding-feed"],
    queryFn: () => ClientPostsApi.getOnboardingFeed(),
    enabled: isOpen,
    staleTime: 30 * 60 * 1000,
  });

  const topics = data?.topics ?? [];

  const postMap = useMemo(() => {
    const map = new Map<number, PostWithForecasts>();
    if (data?.posts) {
      for (const post of data.posts) {
        map.set(post.id, post);
      }
    }
    return map;
  }, [data?.posts]);

  return { topics, postMap, isLoading, fetchError, refetch };
}
