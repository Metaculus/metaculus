import "server-only";
import { BECommentType, CommentOfWeekType } from "@/types/comment";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import CommentsApi, {
  CommentReportReason,
  CreateCommentParams,
  EditCommentParams,
  KeyFactorVoteParams,
  ToggleCMMCommentParams,
  VoteParams,
} from "./comments.shared";

class ServerCommentsApiClass extends CommentsApi {
  async softDeleteComment(id: number): Promise<Response | null> {
    return await this.post<null, null>(`/comments/${id}/delete/`, null);
  }

  async editComment(commentData: EditCommentParams): Promise<Response | null> {
    return await this.post<null, EditCommentParams>(
      `/comments/${commentData.id}/edit/`,
      commentData
    );
  }

  async createComment(
    commentData: CreateCommentParams
  ): Promise<BECommentType> {
    return await this.post<BECommentType, CreateCommentParams>(
      `/comments/create/`,
      commentData
    );
  }

  async addKeyFactorsToComment(
    commentId: number,
    keyFactors: string[]
  ): Promise<BECommentType> {
    return await this.post<BECommentType>(
      `/comments/${commentId}/add-key-factors/`,
      {
        key_factors: keyFactors,
      }
    );
  }

  async togglePin(commentId: number, pin: boolean): Promise<BECommentType> {
    return await this.post(`/comments/${commentId}/toggle-pin/`, {
      pin,
    });
  }

  async voteComment(voteData: VoteParams): Promise<Response | null> {
    return await this.post<null, VoteParams>(
      `/comments/${voteData.id}/vote/`,
      voteData
    );
  }

  async toggleCMMComment(
    params: ToggleCMMCommentParams
  ): Promise<Response | null> {
    return await this.post<null, ToggleCMMCommentParams>(
      `/comments/${params.id}/toggle_cmm/`,
      params
    );
  }

  async report(commentId: number, reason: CommentReportReason) {
    return this.post(`/comments/${commentId}/report/`, { reason });
  }

  async voteKeyFactor(voteData: KeyFactorVoteParams): Promise<Response | null> {
    return await this.post<null, KeyFactorVoteParams>(
      `/key-factors/${voteData.id}/vote/`,
      voteData
    );
  }

  async getCommentsOfWeek(start_date: string): Promise<CommentOfWeekType[]> {
    return await this.get<CommentOfWeekType[]>(
      `/comments/comments-of-week/?start_date=${start_date}`
    );
  }

  async setCommentExcludedFromWeekTop(
    commentId: number,
    excluded: boolean
  ): Promise<Response> {
    return await this.post(
      `/comments/${commentId}/set-excluded-from-week-top/`,
      { excluded }
    );
  }
}

const ServerCommentsApi = new ServerCommentsApiClass(serverFetcher);
export default ServerCommentsApi;
