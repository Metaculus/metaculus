import { CommentType } from "@/types/comment";
import { get, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type CommentsParams = {
  post?: number;
  author?: number;
};

class CommentsApi {
  static async getComments(params?: CommentsParams): Promise<any[]> {
    const queryParams = encodeQueryParams(params ?? {});
    try {
      return await get<CommentType[]>(`/comments${queryParams}`);
    } catch (err) {
      console.error("Error getting comments:", err);
      return [];
    }
  }

  static async softDeleteComment(id: number): Promise<any> {
    try {
      return await post<null, null>(`/comments/${id}/delete`, null);
    } catch (err) {
      console.error("Error getting comment:", err);
      return null;
    }
  }
}

export default CommentsApi;
