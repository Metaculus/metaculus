import { CommentDraft } from "@/types/comment";

import { logError } from "../core/errors";

import { cleanupDrafts } from ".";

const DRAFT_KEY_PREFIX = "comment_draft_";
const MAX_COMMENTS_DRAFT_SIZE_MB = 1.5;

function getDraftKey({
  userId,
  postId,
  parentId,
}: {
  userId: number;
  postId: number;
  parentId?: number;
}): string {
  return `${DRAFT_KEY_PREFIX}${userId}_${postId}${parentId ? `_parent_${parentId}` : ""}`;
}

export function saveCommentDraft(draft: CommentDraft): void {
  try {
    if (!draft.markdown.trim()) {
      deleteCommentDraft({ ...draft });
      return;
    }
    const existingDraft = getCommentDraft(
      draft.userId,
      draft.postId,
      draft.parentId
    );
    if (existingDraft && existingDraft.markdown === draft.markdown) {
      return;
    }
    const draftKey = getDraftKey({ ...draft });
    localStorage.setItem(draftKey, JSON.stringify(draft));
  } catch (error) {
    logError(error, { message: "Failed to save comment draft" });
  }
}
export function getCommentDraft(
  userId: number,
  postId: number,
  parentId?: number
): CommentDraft | null {
  try {
    if (!postId || !userId) return null;
    const draftKey = getDraftKey({ userId, postId, parentId });
    if (!draftKey) return null;

    const draftJson = localStorage.getItem(draftKey);
    return draftJson ? JSON.parse(draftJson) : null;
  } catch (error) {
    logError(error, { message: "Failed to get comment draft" });
    return null;
  }
}

export const deleteCommentDraft = ({
  userId,
  postId,
  parentId,
}: {
  userId: number;
  postId: number;
  parentId?: number;
}): void => {
  try {
    if (!postId || !userId) return;
    const draftKey = getDraftKey({ userId, postId, parentId });

    if (!draftKey) return;
    localStorage.removeItem(draftKey);
  } catch (error) {
    logError(error, { message: "Failed to delete comment draft" });
  }
};

export const cleanupCommentDrafts = (maxAgeDays = 14): void => {
  cleanupDrafts({
    keyPrefix: DRAFT_KEY_PREFIX,
    maxAgeDays,
    maxSizeMB: MAX_COMMENTS_DRAFT_SIZE_MB,
  });
};
