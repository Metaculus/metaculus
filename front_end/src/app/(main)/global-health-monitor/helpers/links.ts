import { ProCommentRef } from "../editions/types";

export function getCommentHref(comment: ProCommentRef) {
  return `/questions/${comment.postId}/#comment-${comment.commentId}`;
}
