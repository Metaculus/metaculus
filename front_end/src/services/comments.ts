import { CommentType } from "@/types/comment";
import { get, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/navigation";

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
      console.error("Error deleting comment:", err);
      return null;
    }
  }

  static async editComment(
    commentData: EditCommentParams
  ): Promise<Response | null> {
    try {
      return await post<null, EditCommentParams>(
        `/comments/${commentData.id}/edit`,
        commentData
      );
      return null;
    } catch (err) {
      console.error("Error editing comment:", err);
      return null;
    }
  }

  static async createComment(
    commentData: CreateCommentParams
  ): Promise<Response | null> {
    try {
      return await post<null, CreateCommentParams>(
        `/comments/create`,
        commentData
      );
    } catch (err) {
      console.error("Error creating comment:", err);
      return null;
    }
  }

  static async voteComment(
    voteData: VoteCommentParams
  ): Promise<Response | null> {
    try {
      return await post<null, VoteCommentParams>(
        `/comments/${voteData.id}/vote`,
        voteData
      );
    } catch (err) {
      console.error("Error creating comment:", err);
      return null;
    }
  }
}

export default CommentsApi;
