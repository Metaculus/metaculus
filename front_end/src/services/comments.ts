import { BECommentType, CommentType } from "@/types/comment";
import { get, post } from "@/utils/fetch";
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
};

export type EditCommentParams = {
  id: number;
  text: string;
  author: number;
};

export type VoteCommentParams = {
  id: number;
  vote: number | null;
  user: number;
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

class CommentsApi {
  static async getComments(
    params?: getCommentsParams
  ): Promise<PaginatedResponse<CommentType>> {
    const queryParams = encodeQueryParams(params ?? {});
    const response = await get<PaginatedResponse<CommentType>>(
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

  static async softDeleteComment(id: number): Promise<Response | null> {
    return await post<null, null>(`/comments/${id}/delete/`, null);
  }

  static async editComment(
    commentData: EditCommentParams
  ): Promise<Response | null> {
    return await post<null, EditCommentParams>(
      `/comments/${commentData.id}/edit/`,
      commentData
    );
  }

  static async createComment(
    commentData: CreateCommentParams
  ): Promise<BECommentType> {
    return await post<BECommentType, CreateCommentParams>(
      `/comments/create/`,
      commentData
    );
  }

  static async voteComment(
    voteData: VoteCommentParams
  ): Promise<Response | null> {
    return await post<null, VoteCommentParams>(
      `/comments/${voteData.id}/vote/`,
      voteData
    );
  }

  static async toggleCMMComment(
    params: ToggleCMMCommentParams
  ): Promise<Response | null> {
    return await post<null, ToggleCMMCommentParams>(
      `/comments/${params.id}/toggle_cmm/`,
      params
    );
  }

  static async report(commentId: number, reason: CommentReportReason) {
    return post(`/comments/${commentId}/report/`, { reason });
  }
}

export default CommentsApi;
