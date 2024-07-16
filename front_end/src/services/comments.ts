import { CommentType } from "@/types/comment";
import { get, handleRequestError, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/navigation";

export type getCommentsParams = {
  post?: number;
  author?: number;
  parent_isnull?: boolean;
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

class CommentsApi {
  static async getComments(
    url: string = "/comments",
    params?: getCommentsParams
  ): Promise<CommentType[]> {
    const queryParams = encodeQueryParams(params ?? {});
    try {
      const response = await get<CommentType[]>(`${url}${queryParams}`);
      return response.map((comment) => {
        if (comment.included_forecast) {
          comment.included_forecast.start_time = new Date(
            comment.included_forecast.start_time
          );
        }
        return comment;
      });
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error getting comments:", err);
        return [];
      });
    }
  }

  static async softDeleteComment(id: number): Promise<Response | null> {
    try {
      return await post<null, null>(`/comments/${id}/delete`, null);
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error deleting comment:", err);
        return null;
      });
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
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error editing comment:", err);
        return null;
      });
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
      return handleRequestError(err, () => {
        console.error("Error creating comment:", err);
        return null;
      });
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
      return handleRequestError(err, () => {
        console.error("Error voting comment:", err);
        return null;
      });
    }
  }
}

export default CommentsApi;
