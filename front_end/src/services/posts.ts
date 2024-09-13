import { PaginatedPayload, PaginationParams } from "@/types/fetch";
import { NewsArticle } from "@/types/news";
import { Post, PostSubscription, PostWithForecasts } from "@/types/post";
import { Require } from "@/types/utils";
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
  for_main_feed?: string;
  ids?: number[];
  news_type?: string;
  public_figure?: number;
  notebook_type?: string;
  similar_to_post_id?: number;
};

export type ApprovePostParams = {
  question_id: number;
  open_time: string;
  cp_reveal_time: string;
};

class PostsApi {
  static async getPost(id: number): Promise<PostWithForecasts> {
    return await get<PostWithForecasts>(
      `/posts/${id}/${encodeQueryParams({ with_cp: true })}`
    );
  }

  static async removePostFromProject(postId: number, projectId: number) {
    await post<any>(`/posts/${postId}/remove_from_project/`, {
      project_id: projectId,
    });
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

  static async getPosts(
    params?: PostsParams
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: false,
    });

    return await get<PaginatedPayload<PostWithForecasts>>(
      `/posts${queryParams}`
    );
  }

  static async getSimilarPosts(postId: number): Promise<PostWithForecasts[]> {
    return await get<PostWithForecasts[]>(`/posts/${postId}/similar-posts/`);
  }

  static async createQuestionPost(body: any): Promise<PostWithForecasts> {
    return await post<PostWithForecasts>(`/posts/create/`, body);
  }

  static async updatePost(id: number, body: any): Promise<PostWithForecasts> {
    return await put<any, PostWithForecasts>(`/posts/${id}/update/`, body);
  }

  static async submitForReview(id: number) {
    return await post(`/posts/${id}/submit-for-review/`, {});
  }

  static async makeDraft(id: number) {
    return await post(`/posts/${id}/make-draft/`, {});
  }

  static async approvePost(id: number, params: ApprovePostParams[]) {
    return await post(`/posts/${id}/approve/`, params);
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

  static async getAllSubscriptions() {
    return get<Require<Post, "subscriptions">[]>(`/posts/subscriptions`, {});
  }

  static async getRelatedNews(postId: number) {
    return get<NewsArticle[]>(`/posts/${postId}/related-articles/`);
  }

  static async removeRelatedArticle(articleId: number) {
    return post(`/itn-articles/${articleId}/remove`, {});
  }
}

export default PostsApi;
