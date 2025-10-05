import type { CreateDraft, Draft, EditDraft } from "@/types/comment";
import { logError } from "@/utils/core/errors";
import { readJSON, safeLocalStorage, writeJSON } from "@/utils/core/storage";

import { cleanupDrafts } from ".";

const PREFIX = {
  create: "comment_draft_",
  edit: "comment_edit_draft_",
} as const;

const MAX_COMMENTS_DRAFT_SIZE_MB = 1.5;

function keyFor(d: Draft): string {
  return d.kind === "create"
    ? `${PREFIX.create}${d.userId}_${d.postId}${d.parentId ? `_parent_${d.parentId}` : ""}`
    : `${PREFIX.edit}${d.userId}_${d.commentId}`;
}

function keyForCreate(
  userId: number,
  postId: number,
  parentId?: number
): string {
  return `${PREFIX.create}${userId}_${postId}${parentId ? `_parent_${parentId}` : ""}`;
}

function keyForEdit(userId: number, commentId: number): string {
  return `${PREFIX.edit}${userId}_${commentId}`;
}

function upsertDraft(draft: Draft): void {
  try {
    if (!draft.markdown?.trim()) {
      draft.kind === "create"
        ? removeCreate(draft.userId, draft.postId, draft.parentId)
        : removeEdit(draft.userId, draft.commentId);
      return;
    }

    const k = keyFor(draft);
    const existing = readJSON<Draft>(k);

    if (existing && existing.lastModified > draft.lastModified) {
      return;
    }

    if (existing) {
      const sameText = existing.markdown === draft.markdown;
      if (sameText) return;
    }

    writeJSON(k, draft);
  } catch (e) {
    logError(e, { message: "Failed to upsert draft" });
  }
}

function getCreate(
  userId: number,
  postId: number,
  parentId?: number
): CreateDraft | null {
  return readJSON<CreateDraft>(keyForCreate(userId, postId, parentId));
}

function getEdit(userId: number, commentId: number): EditDraft | null {
  return readJSON<EditDraft>(keyForEdit(userId, commentId));
}

function removeCreate(userId: number, postId: number, parentId?: number) {
  try {
    safeLocalStorage.removeItem(keyForCreate(userId, postId, parentId));
  } catch (e) {
    logError(e, { message: "Failed to delete comment draft" });
  }
}

function removeEdit(userId: number, commentId: number) {
  try {
    safeLocalStorage.removeItem(keyForEdit(userId, commentId));
  } catch (e) {
    logError(e, { message: "Failed to delete comment edit draft" });
  }
}

export function saveCommentDraft(draft: CreateDraft): void {
  upsertDraft({ ...draft, kind: "create" });
}
export function getCommentDraft(
  userId: number,
  postId: number,
  parentId?: number
): CreateDraft | null {
  return getCreate(userId, postId, parentId);
}
export function deleteCommentDraft(args: {
  userId: number;
  postId: number;
  parentId?: number;
}): void {
  removeCreate(args.userId, args.postId, args.parentId);
}

export function saveCommentEditDraft(draft: EditDraft): void {
  upsertDraft({ ...draft, kind: "edit" });
}
export function getCommentEditDraft(
  userId: number,
  commentId: number
): EditDraft | null {
  return getEdit(userId, commentId);
}
export function deleteCommentEditDraft(args: {
  userId: number;
  commentId: number;
}): void {
  removeEdit(args.userId, args.commentId);
}

export const cleanupCommentDrafts = (maxAgeDays = 14): void => {
  cleanupDrafts({
    keyPrefix: PREFIX.create,
    maxAgeDays,
    maxSizeMB: MAX_COMMENTS_DRAFT_SIZE_MB,
  });
};
export const cleanupCommentEditDrafts = (maxAgeDays = 14): void => {
  cleanupDrafts({
    keyPrefix: PREFIX.edit,
    maxAgeDays,
    maxSizeMB: MAX_COMMENTS_DRAFT_SIZE_MB,
  });
};
