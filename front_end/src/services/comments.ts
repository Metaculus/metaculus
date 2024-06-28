import { CommentType } from "@/types/comment";
import { get, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type CommentsParams = {
  post?: number;
  author?: number;
};

export type CreateCommentParams = {
  author: number;
  parent?: number;
  text: string;
  on_post?: number;
  included_forecast?: number;
};

class CommentsApi {
  static async getComments(params?: CommentsParams): Promise<CommentType[]> {
    const queryParams = encodeQueryParams(params ?? {});
    try {
      return await get<CommentType[]>(`/comments${queryParams}`);
    } catch (err) {
      console.error("Error getting comments:", err);
      return [];
    }
  }

  static async softDeleteComment(id: number): Promise<Response | null> {
    try {
      return await post<null, null>(`/comments/${id}/delete`, null);
    } catch (err) {
      console.error("Error getting comment:", err);
      return null;
    }
  }

  static async createComment(
    commentData: CreateCommentParams
  ): Promise<Response | null> {
    try {
      return await post<null, CreateCommentParams>(`/comments/create`, {
        author: commentData.author,
        parent: commentData.parent,
        text: commentData.text,
        on_post: commentData.on_post,
        included_forecast: commentData.included_forecast,
      });
    } catch (err) {
      console.error("Error getting comment:", err);
      return null;
    }
  }
}

export default CommentsApi;
