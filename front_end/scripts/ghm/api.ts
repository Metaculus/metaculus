import { chunk } from "lodash";

import { getAllGhmPostIds } from "../../src/app/(main)/global-health-monitor/config/sections";
import {
  GroupOfQuestionsGraphType,
  PostWithForecasts,
} from "../../src/types/post";

export type ApiConfig = { baseUrl: string; token: string | undefined };

export function getApiConfig(override?: string): ApiConfig {
  return {
    baseUrl: (
      override ??
      process.env.METACULUS_API_BASE_URL ??
      "https://www.metaculus.com/api"
    ).replace(/\/$/, ""),
    token: process.env.METACULUS_API_TOKEN,
  };
}

export async function apiGet<T>(
  config: ApiConfig,
  path: string,
  params: Record<string, string | number | boolean | number[]> = {}
): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      search.append(key, String(item));
    }
  }
  const query = search.toString();
  const response = await fetch(
    `${config.baseUrl}${path}${query ? `?${query}` : ""}`,
    {
      headers: {
        Accept: "application/json",
        ...(config.token ? { Authorization: `Token ${config.token}` } : {}),
      },
    }
  );
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} for ${path}`);
  }
  return (await response.json()) as T;
}

// Mirrors the dashboard's fetch: list endpoint in chunks, detail endpoint for groups
// whose sub-question history the list endpoint truncates.
export async function fetchGhmPostsFromApi(
  config: ApiConfig
): Promise<Map<number, PostWithForecasts>> {
  const posts = new Map<number, PostWithForecasts>();
  for (const ids of chunk(getAllGhmPostIds(), 8)) {
    const { results } = await apiGet<{ results: PostWithForecasts[] }>(
      config,
      "/posts/",
      {
        ids,
        limit: ids.length,
        with_cp: true,
        include_cp_history: true,
        include_descriptions: false,
      }
    );
    for (const post of results) {
      posts.set(post.id, post);
    }
  }
  for (const post of [...posts.values()]) {
    const group = post.group_of_questions;
    if (
      group &&
      group.graph_type !== GroupOfQuestionsGraphType.FanGraph &&
      group.questions.length > 3
    ) {
      posts.set(
        post.id,
        await apiGet<PostWithForecasts>(config, `/posts/${post.id}/`)
      );
    }
  }
  return posts;
}
