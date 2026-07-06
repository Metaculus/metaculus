import "server-only";
import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { PostWithForecasts } from "@/types/post";

import { JOBS_DATA, LABOR_HUB_POST_IDS } from "../data";

export const LABOR_HUB_REVALIDATE_SECONDS = 60 * 15;

function collectPostIds(value: unknown, ids: number[] = []): number[] {
  if (typeof value === "number") {
    ids.push(value);
    return ids;
  }

  if (value && typeof value === "object") {
    for (const nestedValue of Object.values(value)) {
      collectPostIds(nestedValue, ids);
    }
  }

  return ids;
}

export const LABOR_HUB_ALL_POST_IDS = Array.from(
  new Set([
    ...collectPostIds(LABOR_HUB_POST_IDS),
    // Keep job IDs sourced from JOBS_DATA so the job table has one source of truth.
    ...JOBS_DATA.map((job) => job.post_id),
  ])
);

export const fetchLaborHubPosts = cache(async () => {
  const { results: posts } = await ServerPostsApi.getPostsWithCPAnonymous(
    {
      ids: LABOR_HUB_ALL_POST_IDS,
      include_cp_history: true,
      limit: LABOR_HUB_ALL_POST_IDS.length,
    },
    { next: { revalidate: LABOR_HUB_REVALIDATE_SECONDS } }
  );

  return new Map(posts.map((post) => [post.id, post]));
});

export async function fetchLaborHubPost(
  postId: number
): Promise<PostWithForecasts | null> {
  const postsById = await fetchLaborHubPosts();
  return postsById.get(postId) ?? null;
}

export async function fetchLaborHubPostsByIds(
  postIds: number[]
): Promise<PostWithForecasts[]> {
  const postsById = await fetchLaborHubPosts();
  return postIds.flatMap((postId) => {
    const post = postsById.get(postId);
    return post ? [post] : [];
  });
}
