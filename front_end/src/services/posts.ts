import { PaginatedPayload, PaginationParams } from "@/types/fetch";
import { Post, PostWithForecasts } from "@/types/post";
import { VoteDirection, VoteResponse } from "@/types/votes";
import { get, handleRequestError, post, put } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/navigation";

export type PostsParams = PaginationParams & {
  topic?: string;
  answered_by_me?: boolean;
  search?: string;
  forecast_type?: string | string[];
  statuses?: string | string[];
  categories?: string | string[];
  usernames?: string | string[];
  tags?: string | string[];
  forecaster_id?: string;
  not_forecaster_id?: string;
  author?: string;
  upvoted_by?: string;
  access?: string;
  commented_by?: string;
  order_by?: string;
  tournaments?: string | string[];
  ids?: number[];
  news_type?: string;
  public_figure?: number;
  notebook_type?: string;
};

class PostsApi {
  static async getPost(id: number): Promise<PostWithForecasts | null> {
    try {
      return await get<PostWithForecasts>(
        `/posts/${id}${encodeQueryParams({ with_cp: true })}`
      );
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error getting post:", err);
        return null;
      });
    }
  }

  static async getPosts(params?: PostsParams): Promise<Post[]> {
    const queryParams = encodeQueryParams(params ?? {});
    try {
      const data = await get<PaginatedPayload<Post>>(`/posts${queryParams}`);
      return data.results;
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error getting posts:", err);
        return [];
      });
    }
  }

  static async getPostWithoutForecasts(
    params?: PostsParams
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: true,
    });

    try {
      return await get<PaginatedPayload<PostWithForecasts>>(
        `/posts${queryParams}`
      );
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error getting posts:", err);
        return { count: 0, results: [], next: null, previous: null };
      });
    }
  }

  static async createQuestionPost(
    body: any
  ): Promise<PostWithForecasts | null> {
    try {
      return await post<PostWithForecasts>(`/posts/create/`, body);
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error creating post:", err);
        return null;
      });
    }
  }

  static async updatePost(
    id: number,
    body: any
  ): Promise<PostWithForecasts | null> {
    try {
      return await put<any, PostWithForecasts>(`/posts/${id}/update/`, body);
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error updating post:", err);
        return null;
      });
    }
  }

  static async votePost(
    id: number,
    direction: VoteDirection
  ): Promise<VoteResponse> {
    return await post<VoteResponse>(`/posts/${id}/vote`, { direction });
  }

  static async uploadImage(formData: FormData): Promise<{ url: string }> {
    return await post<{ url: string }>("/posts/upload-image", formData);
  }

  static async sendPostReadEvent(postId: number) {
    return post(`/posts/${postId}/read`, {});
  }

  static async changePostActivityBoost(postId: number, score: number) {
    return post<{ score_total: number }>(`/posts/${postId}/boost`, { score });
  }
}

export default PostsApi;
