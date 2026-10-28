import { ProCommentRef } from "../editions/types";

export function getCommentHref(comment: ProCommentRef) {
  return `/questions/${comment.postId}/#comment-${comment.commentId}`;
}

// The latest edition is the default, so it stays out of URLs.
export function getEditionQuery(slug: string | null) {
  return slug ? `?edition=${slug}` : "";
}
