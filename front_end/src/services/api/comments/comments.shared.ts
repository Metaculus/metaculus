import { ApiService } from "@/services/api/api_service";
import { clientPath } from "@/services/api/client_path";
import {
  CommentOfWeekEntry,
  CommentType,
  KeyFactorVoteReason,
  KeyFactorVoteType,
} from "@/types/comment";
import { KeyFactorDraft } from "@/types/key_factors";
import { encodeQueryParams } from "@/utils/navigation";

export type getCommentsParams = {
  post?: number;
  author?: number;
  parent_isnull?: boolean;
  limit?: number;
  offset?: number;
  sort?: string;
  use_root_comments_pagination?: boolean;
  focus_comment_id?: string;
  focus_thread_only?: boolean;
  is_private?: boolean;
  last_viewed_at?: string;
  time_window?: "all_time" | "past_week" | "past_month" | "past_year";
  search?: string;
  exclude_bots?: boolean;
  exclude_bots_only_project?: boolean;
  include_deleted?: boolean;
  post_status?: string;
};

export type KeyFactorWritePayload = KeyFactorDraft;

export type CreateCommentParams = {
  parent?: number;
  text: string;
  on_post?: number;
  included_forecast?: boolean;
  is_private: boolean;
  key_factors?: KeyFactorWritePayload[];
};

export type EditCommentParams = {
  id: number;
  text: string;
  author: number;
  include_forecast?: boolean;
};

export type VoteParams = {
  id: number;
  vote: number | null;
  user: number;
};

export type KeyFactorVoteParams = VoteParams & {
  vote_type: KeyFactorVoteType;
  vote_reason?: KeyFactorVoteReason | null;
};

export type ToggleCMMCommentParams = {
  id: number;
  enabled: boolean;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_count: number;
};

export type CommentReportReason = "spam" | "violation" | "ai_generated";

class CommentsApi extends ApiService {
  static readonly clientRoutes = {
    comments: "/comments/",
    comment: "/comments/:commentId/",
    commentsOfWeek: "/comments/comments-of-week/",
    suggestedKeyFactors: "/comments/:commentId/suggested-key-factors/",
  } as const;

  async getComments(
    params?: getCommentsParams
  ): Promise<PaginatedResponse<CommentType>> {
    const queryParams = encodeQueryParams(params ?? {});
    const response = await this.get<PaginatedResponse<CommentType>>(
      `${clientPath(CommentsApi.clientRoutes.comments)}${queryParams}`
    );
    response.results = response.results.map((comment) => {
      if (comment.included_forecast) {
        comment.included_forecast.start_time = new Date(
          comment.included_forecast.start_time
        );
      }
      return comment;
    });
    return response;
  }

  async getComment(id: number): Promise<CommentType> {
    return await this.get<CommentType>(
      clientPath(CommentsApi.clientRoutes.comment, { commentId: id })
    );
  }

  async getCommentsOfWeek(start_date: string): Promise<CommentOfWeekEntry[]> {
    return await this.get<CommentOfWeekEntry[]>(
      `${clientPath(CommentsApi.clientRoutes.commentsOfWeek)}?start_date=${start_date}`
    );
  }

  async getSuggestedKeyFactors(
    commentId: number
  ): Promise<KeyFactorWritePayload[]> {
    return await this.get<KeyFactorWritePayload[]>(
      clientPath(CommentsApi.clientRoutes.suggestedKeyFactors, { commentId })
    );
  }
}

export default CommentsApi;
