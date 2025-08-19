import { ApiService } from "@/services/api/api_service";
import {
  CommentType,
  KeyFactorVoteType,
  CommentOfWeekType,
} from "@/types/comment";
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
  is_private?: boolean;
};

export type CreateCommentParams = {
  parent?: number;
  text: string;
  on_post?: number;
  included_forecast?: boolean;
  is_private: boolean;
  key_factors?: string[];
};

export type EditCommentParams = {
  id: number;
  text: string;
  author: number;
};

export type VoteParams = {
  id: number;
  vote: number | null;
  user: number;
};

export type KeyFactorVoteParams = VoteParams & {
  vote_type: KeyFactorVoteType;
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

export type CommentReportReason = "spam" | "violation";

class CommentsApi extends ApiService {
  async getComments(
    params?: getCommentsParams
  ): Promise<PaginatedResponse<CommentType>> {
    const queryParams = encodeQueryParams(params ?? {});
    const response = await this.get<PaginatedResponse<CommentType>>(
      `/comments/${queryParams}`
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

  async getCommentsOfWeek(start_date: string): Promise<CommentOfWeekType[]> {
    return await this.get<CommentOfWeekType[]>(
      `/comments/comments-of-week/?start_date=${start_date}`
    );
  }

  async getSuggestedKeyFactors(commentId: number): Promise<string[]> {
    return await this.get<string[]>(
      `/comments/${commentId}/suggested-key-factors/`
    );
  }
}

export default CommentsApi;
