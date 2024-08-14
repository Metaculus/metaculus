import { PaginatedPayload, PaginationParams } from "@/types/fetch";
import { NewsArticle } from "@/types/news";
import { Post, PostSubscription, PostWithForecasts } from "@/types/post";
import { VoteDirection, VoteResponse } from "@/types/votes";
import { get, post, put } from "@/utils/fetch";
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
  similar_to_post_id?: number;
};

class PostsApi {
  static async getPost(id: number): Promise<PostWithForecasts> {
    return await get<PostWithForecasts>(
      `/posts/${id}${encodeQueryParams({ with_cp: true })}`
    );
  }

  static async getPosts(params?: PostsParams): Promise<Post[]> {
    const queryParams = encodeQueryParams(params ?? {});
    const data = await get<PaginatedPayload<Post>>(`/posts${queryParams}`);
    return data.results;
  }

  static async getPostsWithCP(
    params?: PostsParams
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: true,
    });

    return await get<PaginatedPayload<PostWithForecasts>>(
      `/posts${queryParams}`
    );
  }

  static async createQuestionPost(body: any): Promise<PostWithForecasts> {
    return await post<PostWithForecasts>(`/posts/create/`, body);
  }

  static async updatePost(id: number, body: any): Promise<PostWithForecasts> {
    return await put<any, PostWithForecasts>(`/posts/${id}/update/`, body);
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

  static async updateSubscriptions(
    postId: number,
    subscriptions: PostSubscription[]
  ) {
    return post<PostSubscription[], PostSubscription[]>(
      `/posts/${postId}/subscriptions`,
      subscriptions
    );
  }

  static async getRelatedNews(postId: number) {
    return get<NewsArticle[]>(`/posts/${postId}/related-news`);
  }
}

export default PostsApi;
