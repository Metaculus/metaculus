import { CommentType } from "@/types/comment";
import { PaginatedPayload } from "@/types/fetch";
import { get, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type CommentsParams = {
  question?: number;
};

class CommentsApi {
  static async getComment(id: number): Promise<any> {
    try {
      return await get<any>(`/comments/${id}`);
    } catch (err) {
      console.error("Error getting comment:", err);
      return null;
    }
  }

  static async getComments(params?: CommentsParams): Promise<any[]> {
    const queryParams = encodeQueryParams(params ?? {});
    try {
      const data = await get<PaginatedPayload<any>>(`/comments${queryParams}`);
      return data.results;
    } catch (err) {
      console.error("Error getting questions:", err);
      return [];
    }
  }

  /*
  static async voteComment(
    id: number,
    direction: VoteDirection
  ): Promise<VoteResponse> {
    return await post<VoteResponse>(`/comments/${id}/vote`, { direction });
  }
  */
}

export default CommentsApi;
