"use server";

import PostsApi from "@/services/posts";
import { PostWithForecasts } from "@/types/post";

export async function getPost(
  id: number,
  with_cp = true
): Promise<PostWithForecasts> {
  return await PostsApi.getPost(id, with_cp);
}
