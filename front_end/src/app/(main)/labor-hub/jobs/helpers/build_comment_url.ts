/**
 * Builds the canonical URL for a comment on a Metaculus question post.
 * Matches the pattern used elsewhere in the codebase (e.g. labor-hub activity_data.tsx).
 */
export function buildCommentUrl(postId: number, commentId: number): string {
  return `/questions/${postId}/#comment-${commentId}`;
}
