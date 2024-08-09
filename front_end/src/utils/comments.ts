import { BECommentType, CommentType } from "@/types/comment";

export function parseComment(comment: BECommentType): CommentType {
  return {
    id: comment.id,
    parent_id: comment.parent_id,
    author: comment.author,
    children: [],
    text: comment.text,
    on_post: comment.on_post,
    created_at: comment.created_at,
    is_soft_deleted: comment.is_soft_deleted,
    included_forecast: comment.included_forecast,
    is_private: comment.is_private,
    vote_score: comment.vote_score,
    user_vote: comment.user_vote,
    changed_my_mind: comment.changed_my_mind,
  };
}
