import { revalidateTag } from "next/cache";

import {
  FetchOptions,
  PaginatedPayload,
  PaginationParams,
} from "@/types/fetch";
import { NewsArticle } from "@/types/news";
import {
  Post,
  PostSubscription,
  PostWithForecasts,
  NotebookPost,
} from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { Require } from "@/types/utils";
import { VoteDirection, VoteResponse } from "@/types/votes";
import { get, post, put, del } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/navigation";

export type PostsParams = PaginationParams & {
  following?: boolean;
  page?: number;
  topic?: string;
  answered_by_me?: boolean;
  search?: string;
  forecast_type?: string | string[];
  statuses?: string | string[];
  categories?: string | string[];
  usernames?: string | string[];
  tags?: string | string[];
  forecaster_id?: string;
  withdrawn?: string;
  not_forecaster_id?: string;
  author?: string;
  upvoted_by?: string;
  access?: string;
  commented_by?: string;
  order_by?: string;
  tournaments?: string | string[];
  community?: string;
  for_main_feed?: string;
  ids?: number[];
  news_type?: string;
  public_figure?: number;
  curation_status?: string;
  notebook_type?: string;
  similar_to_post_id?: number;
  default_project_id?: string;
};

export type ApprovePostParams = {
  published_at: string;
  open_time: string;
  cp_reveal_time: string;
  scheduled_close_time: string;
  scheduled_resolve_time: string;
  move_forecasting_end_date?: boolean;
};

class PostsApi {
  static async getPost(id: number, with_cp = true): Promise<PostWithForecasts> {
    return await get<PostWithForecasts>(
      `/posts/${id}/${encodeQueryParams({ with_cp })}`
    );
  }

  static async getQuestion(
    id: number,
    with_cp = true
  ): Promise<QuestionWithForecasts> {
    return await get<QuestionWithForecasts>(
      `/questions/${id}/${encodeQueryParams({ with_cp })}`
    );
  }

  static async getPostAnonymous(
    id: number,
    options?: FetchOptions
  ): Promise<PostWithForecasts> {
    return await get<PostWithForecasts>(`/posts/${id}/`, options, {
      passAuthHeader: false,
    });
  }

  static async removePostFromProject(postId: number, projectId: number) {
    await post(`/posts/${postId}/remove_from_project/`, {
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
      `/posts/${queryParams}`
    );
  }

  static async getPostsWithCPAnonymous(
    params?: PostsParams,
    options?: FetchOptions
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: true,
    });

    return await get<PaginatedPayload<PostWithForecasts>>(
      `/posts/${queryParams}`,
      options,
      { passAuthHeader: false }
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
      `/posts/${queryParams}`
    );
  }

  static async getPostsForHomepage(): Promise<
    (PostWithForecasts | NotebookPost)[]
  > {
    return await get(`/posts/homepage/`, {
      next: {
        revalidate: 900,
      },
    });
  }

  static async createQuestionPost<
    T extends PostWithForecasts | NotebookPost,
    B,
  >(body: B): Promise<T> {
    return await post(`/posts/create/`, body);
  }

  static async updatePost<T extends PostWithForecasts | NotebookPost, B>(
    id: number,
    body: B
  ): Promise<T> {
    return await put(`/posts/${id}/update/`, body);
  }

  static async submitForReview(id: number) {
    return await post(`/posts/${id}/submit-for-review/`, {});
  }

  static async rejectPost(id: number) {
    return await post(`/posts/${id}/reject/`, {});
  }

  static async deletePost(id: number) {
    return await del(`/posts/${id}/delete/`, {});
  }

  static async sendBackToReview(id: number) {
    return await post(`/posts/${id}/send-back-to-review/`, {});
  }

  static async makeDraft(id: number) {
    return await post(`/posts/${id}/make-draft/`, {});
  }

  static async approvePost(id: number, params: ApprovePostParams) {
    return await post(`/posts/${id}/approve/`, params);
  }

  static async votePost(
    id: number,
    direction: VoteDirection
  ): Promise<VoteResponse> {
    return await post<VoteResponse>(`/posts/${id}/vote/`, { direction });
  }

  static async uploadImage(formData: FormData): Promise<{ url: string }> {
    return await post<{ url: string }, FormData>(
      "/posts/upload-image/",
      formData
    );
  }

  static async sendPostReadEvent(postId: number) {
    return post(`/posts/${postId}/read/`, {});
  }

  static async changePostActivityBoost(postId: number, score: number) {
    return post<{ score_total: number }>(`/posts/${postId}/boost/`, { score });
  }

  static async updateSubscriptions(
    postId: number,
    subscriptions: PostSubscription[]
  ) {
    return post<PostSubscription[], PostSubscription[]>(
      `/posts/${postId}/subscriptions/`,
      subscriptions
    );
  }

  static async getAllSubscriptions() {
    return get<Require<Post, "subscriptions">[]>(`/posts/subscriptions/`, {});
  }

  static async getSimilarPosts(postId: number): Promise<PostWithForecasts[]> {
    return await get<PostWithForecasts[]>(`/posts/${postId}/similar-posts/`, {
      next: { revalidate: 3600 },
    });
  }

  static async getRelatedNews(postId: number) {
    return get<NewsArticle[]>(`/posts/${postId}/related-articles/`, {
      next: { revalidate: 3600, tags: ["related-articles"] },
    });
  }

  static async removeRelatedArticle(articleId: number) {
    const response = await post(`/itn-articles/${articleId}/remove/`, {});
    revalidateTag("related-articles");

    return response;
  }

  static async getRandomPostId(): Promise<{ id: number; post_slug: string }> {
    return await get<{ id: number; post_slug: string }>("/posts/random/");
  }

  static async getPostZipData(postId: number): Promise<Blob> {
    return await get<Blob>(`/posts/${postId}/download-data/`);
  }

  static async getAggregationsPostZipData(
    postId: number,
    subQuestionId?: number,
    aggregationMethods?: string,
    includeBots?: boolean
  ): Promise<Blob> {
    const queryParams = encodeQueryParams({
      ...(subQuestionId ? { sub_question: subQuestionId } : {}),
      ...(aggregationMethods
        ? { aggregation_methods: aggregationMethods }
        : { aggregation_methods: "all" }),
      ...(includeBots !== undefined ? { include_bots: includeBots } : {}),
    });

    return await get<Blob>(`/posts/${postId}/download-data/${queryParams}`);
  }

  static async repost(postId: number, projectId: number) {
    return post(`/posts/${postId}/repost/`, { project_id: projectId });
  }
}

export default PostsApi;
