import { ApiService } from "@/services/api/api_service";
import {
  FetchOptions,
  PaginatedPayload,
  PaginationParams,
} from "@/types/fetch";
import { NewsArticle } from "@/types/news";
import {
  NotebookPost,
  Post,
  PostWithForecasts,
  PredictionFlowPost,
} from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { DataParams, Require, WhitelistStatus } from "@/types/utils";
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
  leaderboard_tags?: string | string[];
  forecaster_id?: string;
  for_consumer_view?: string;
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
  news_type?: string | string[];
  curation_status?: string;
  similar_to_post_id?: number;
  default_project_id?: string;
};

export type ApprovePostParams = {
  published_at: string | undefined;
  open_time: string | undefined;
  cp_reveal_time: string | undefined;
  scheduled_close_time: string | undefined;
  scheduled_resolve_time: string | undefined;
};

export type PrivateNoteWithPost = {
  post: { id: number; title: string; slug: string };
  text: string;
  updated_at: string;
};

export type BoostDirection = 1 | -1;

class PostsApi extends ApiService {
  async getPost(id: number, with_cp = true): Promise<PostWithForecasts> {
    return await this.get<PostWithForecasts>(
      `/posts/${id}/${encodeQueryParams({ with_cp })}`
    );
  }

  /**
   * Returns post in original content
   */
  async getPostOriginal(id: number): Promise<PostWithForecasts> {
    return await this.get<PostWithForecasts>(
      `/posts/${id}/${encodeQueryParams({ with_cp: false })}`,
      undefined,
      {
        forceLocale: "original",
      }
    );
  }

  async getQuestion(
    id: number,
    with_cp = true
  ): Promise<QuestionWithForecasts> {
    return await this.get<QuestionWithForecasts>(
      `/questions/${id}/${encodeQueryParams({ with_cp })}`
    );
  }

  async getPostAnonymous(
    id: number,
    options?: FetchOptions
  ): Promise<PostWithForecasts> {
    return await this.get<PostWithForecasts>(`/posts/${id}/`, options, {
      passAuthHeader: false,
    });
  }

  async getPostsWithCP(
    params?: PostsParams
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: true,
      include_descriptions: false,
      include_cp_history: true,
      include_movements: true,
    });

    return await this.get<PaginatedPayload<PostWithForecasts>>(
      `/posts/${queryParams}`
    );
  }

  async getPostsWithCPAnonymous(
    params?: PostsParams,
    options?: FetchOptions
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: true,
    });

    return await this.get<PaginatedPayload<PostWithForecasts>>(
      `/posts/${queryParams}`,
      options,
      { passAuthHeader: false }
    );
  }

  async getPosts(
    params?: PostsParams
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: false,
    });

    return await this.get<PaginatedPayload<PostWithForecasts>>(
      `/posts/${queryParams}`
    );
  }

  async getPostsForHomepage(): Promise<(PostWithForecasts | NotebookPost)[]> {
    return await this.get(`/posts/homepage/`, {
      next: {
        revalidate: 900,
      },
    });
  }

  async getPostsWithCPForHomepage(
    params?: PostsParams
  ): Promise<PaginatedPayload<PostWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_cp: true,
      include_descriptions: false,
      include_cp_history: true,
      include_movements: true,
    });

    return await this.get<PaginatedPayload<PostWithForecasts>>(
      `/posts/${queryParams}`,
      {
        next: {
          revalidate: 30 * 60,
        },
      }
    );
  }
  async getTournamentForecastFlowPosts(
    tournamentSlug: string
  ): Promise<PredictionFlowPost[]> {
    return await this.get(
      `/projects/tournaments/${tournamentSlug}/forecast-flow-posts/`
    );
  }

  async getAllSubscriptions() {
    return this.get<Require<Post, "subscriptions">[]>(
      `/posts/subscriptions/`,
      {}
    );
  }

  async getSimilarPosts(postId: number): Promise<PostWithForecasts[]> {
    return await this.get<PostWithForecasts[]>(
      `/posts/${postId}/similar-posts/`,
      {
        next: { revalidate: 3600 },
      }
    );
  }

  async getRelatedNews(postId: number) {
    return this.get<NewsArticle[]>(`/posts/${postId}/related-articles/`, {
      next: { revalidate: 3600, tags: ["related-articles"] },
    });
  }

  async getRandomPostId(): Promise<{ id: number; post_slug: string }> {
    return await this.get<{ id: number; post_slug: string }>("/posts/random/");
  }

  async getPostZipData(params: DataParams): Promise<Blob> {
    const queryParams = encodeQueryParams(params);
    return await this.get<Blob>(`/data/download/${queryParams}`);
  }

  async emailData(params: DataParams): Promise<{
    message: string;
  }> {
    return await this.post(`/data/email/`, params);
  }

  async getAggregationsPostZipData(
    postId: number,
    subQuestionId?: number,
    aggregationMethods?: string,
    includeBots?: boolean,
    userIds?: number[],
    joinedBeforeDate?: string
  ): Promise<Blob> {
    const queryParams = encodeQueryParams({
      ...(subQuestionId ? { sub_question: subQuestionId } : {}),
      ...(aggregationMethods
        ? { aggregation_methods: aggregationMethods }
        : { aggregation_methods: "all" }),
      ...(includeBots !== undefined ? { include_bots: includeBots } : {}),
      ...(userIds !== undefined ? { user_ids: userIds } : {}),
      ...(joinedBeforeDate ? { joined_before_date: joinedBeforeDate } : {}),
    });

    return await this.get<Blob>(
      `/posts/${postId}/download-data/${queryParams}`
    );
  }

  async getWhitelistStatus(params: {
    post_id?: number;
    project_id?: number;
  }): Promise<WhitelistStatus> {
    const queryParams = encodeQueryParams(params);
    return await this.get<WhitelistStatus>(
      `/get-whitelist-status/${queryParams}`
    );
  }

  async getPrivateNotes(
    params?: PaginationParams
  ): Promise<PaginatedPayload<PrivateNoteWithPost>> {
    const queryParams = encodeQueryParams(params ?? {});
    return await this.get<PaginatedPayload<PrivateNoteWithPost>>(
      `/posts/private-notes/${queryParams}`
    );
  }
}

export default PostsApi;
