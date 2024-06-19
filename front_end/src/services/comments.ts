import { CommentType } from "@/types/comment";
import { get, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type CommentsParams = {
  post?: number;
  author?: number;
};

class CommentApi {
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
      const data = await get<any>(`/comments${queryParams}`);
      return data;
    } catch (err) {
      console.error("Error getting comments:", err);
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

export default CommentApi;
