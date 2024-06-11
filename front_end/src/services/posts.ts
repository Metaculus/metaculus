import { PaginatedPayload, PaginationParams } from "@/types/fetch";
import { Post, PostWithForecasts } from "@/types/post";
import { VoteDirection, VoteResponse } from "@/types/votes";
import { get, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type PostsParams = PaginationParams & {
  topic?: string;
  answered_by_me?: boolean;
  search?: string;
  forecast_type?: string | string[];
  status?: string | string[];
  categories?: string | string[];
  tags?: string | string[];
  guessed_by?: string;
  not_guessed_by?: string;
  author?: string;
  upvoted_by?: string;
  access?: string;
  commented_by?: string;
  order_by?: string;
  tournaments?: string | string[];
};

class PostsApi {
  static async getPost(id: number): Promise<PostWithForecasts | null> {
    try {
      return await get<PostWithForecasts>(
        `/posts/${id}${encodeQueryParams({ with_forecasts: true })}`
      );
    } catch (err) {
      console.error("Error getting post:", err);
      return null;
    }
  }

  static async getPosts(params?: PostsParams): Promise<Post[]> {
    const queryParams = encodeQueryParams(params ?? {});
    try {
      const data = await get<PaginatedPayload<Post>>(`/posts${queryParams}`);
      return data.results;
    } catch (err) {
      console.error("Error getting posts:", err);
      return [];
    }
  }

  static async getPostWithoutForecasts(
    params?: PostsParams
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_forecasts: true,
    });

    try {
      return await get<PaginatedPayload<PostWithForecasts>>(
        `/posts${queryParams}`
      );
    } catch (err) {
      console.error("Error getting posts:", err);
      return { count: 0, results: [], next: null, previous: null };
    }
  }

  static async votePost(
    id: number,
    direction: VoteDirection
  ): Promise<VoteResponse> {
    return await post<VoteResponse>(`/posts/${id}/vote`, { direction });
  }
}

export default PostsApi;
