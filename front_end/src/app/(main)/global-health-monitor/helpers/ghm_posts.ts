import "server-only";

import { chunk } from "lodash";
import { cache } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { GroupOfQuestionsGraphType, PostWithForecasts } from "@/types/post";
import { logError } from "@/utils/core/errors";

import { GHM_REVALIDATE_SECONDS } from "../config/season";
import { getAllGhmPostIds } from "../config/sections";

// Keeps each cached list response well under Next's 2 MB fetch-cache limit.
const LIST_CHUNK_SIZE = 8;
// The list endpoint only returns history for the first 3 sub-questions of non-fan-graph groups.
const LIST_GROUP_HISTORY_CUTOFF = 3;

function needsDetailFetch(post: PostWithForecasts) {
  const group = post.group_of_questions;
  return (
    !!group &&
    group.graph_type !== GroupOfQuestionsGraphType.FanGraph &&
    group.questions.length > LIST_GROUP_HISTORY_CUTOFF
  );
}

async function fetchListChunk(ids: number[]): Promise<PostWithForecasts[]> {
  try {
    const { results } = await ServerPostsApi.getPostsWithCPAnonymous(
      {
        ids,
        limit: ids.length,
        include_cp_history: true,
        include_descriptions: false,
      },
      { next: { revalidate: GHM_REVALIDATE_SECONDS } }
    );
    return results;
  } catch (error) {
    logError(error);
    return [];
  }
}

async function fetchDetail(id: number): Promise<PostWithForecasts | null> {
  try {
    return await ServerPostsApi.getPostAnonymous(id, {
      next: { revalidate: GHM_REVALIDATE_SECONDS },
    });
  } catch (error) {
    logError(error);
    return null;
  }
}

export const fetchGhmPosts = cache(
  async (): Promise<Map<number, PostWithForecasts>> => {
    const chunks = chunk(getAllGhmPostIds(), LIST_CHUNK_SIZE);
    const listed = (await Promise.all(chunks.map(fetchListChunk))).flat();
    const posts = new Map(listed.map((post) => [post.id, post]));

    const detailed = await Promise.all(
      listed.filter(needsDetailFetch).map((post) => fetchDetail(post.id))
    );
    for (const post of detailed) {
      if (post) {
        posts.set(post.id, post);
      }
    }

    return posts;
  }
);
