"use client";

import { useQuery } from "@tanstack/react-query";

import ClientPostsApi from "@/services/api/posts/posts.client";

export function usePostData(postId: number | null) {
  return useQuery({
    queryKey: ["post-data", postId, false], // [post-data, postId, withCP]
    enabled: postId !== null,
    queryFn: async () => {
      if (postId === null) {
        throw new Error("Missing post id");
      }
      return await ClientPostsApi.getPost(postId, false);
    },
  });
}
