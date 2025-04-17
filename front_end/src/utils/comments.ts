import { userTagPattern } from "@/constants/comments";
import {
  AuthorType,
  BECommentType,
  CommentDraft,
  CommentType,
} from "@/types/comment";
import { logError } from "@/utils/errors";

import { cleanupDrafts } from "./storage";

const DRAFT_KEY_PREFIX = "comment_draft_";
const MAX_COMMENTS_DRAFT_SIZE_MB = 1.5;

export function parseComment(
  comment: BECommentType | CommentType
): CommentType {
  return {
    id: comment.id,
    root_id: comment.root_id,
    parent_id: comment.parent_id,
    author: comment.author,
    author_staff_permission: comment.author_staff_permission,
    children: [],
    text: comment.text,
    on_post: comment.on_post,
    on_post_data: comment.on_post_data,
    created_at: comment.created_at,
    text_edited_at: comment.text_edited_at,
    is_soft_deleted: comment.is_soft_deleted,
    included_forecast: comment.included_forecast,
    is_private: comment.is_private,
    vote_score: comment.vote_score,
    user_vote: comment.user_vote,
    changed_my_mind: comment.changed_my_mind,
    mentioned_users: comment.mentioned_users,
    is_current_content_translated: comment.is_current_content_translated,
    key_factors: comment.key_factors,
    is_pinned: comment.is_pinned,
  };
}

export function parseUserMentions(
  markdown: string,
  mentionedUsers?: AuthorType[]
): string {
  function isInsideSquareBrackets(index: number) {
    let insideBrackets = false;
    for (let i = 0; i < index; i++) {
      if (markdown[i] === "[") insideBrackets = true;
      if (markdown[i] === "]") insideBrackets = false;
    }
    return insideBrackets;
  }

  markdown = markdown.replace(
    userTagPattern,
    (match, _group1, group2, group3, offset) => {
      if (isInsideSquareBrackets(offset)) {
        return match;
      }
      // remove only the leading "@" and clean parentheses around the username
      let cleanedUsername = match.replace(/^@/, "");
      cleanedUsername = cleanedUsername.replace(/^\(([^)]+)\)$/, "$1");

      switch (cleanedUsername.toLowerCase()) {
        case "moderators":
          return `[@${cleanedUsername}](/faq/#moderators-tag)`;
        case "predictors":
          return `[@${cleanedUsername}](/faq/#predictors-tag)`;
        case "admins":
          return `[@${cleanedUsername}](/faq/#admins-tag)`;
        case "members":
          return `[@${cleanedUsername}](/faq/#members-tag)`;
        default:
          break;
      }

      const mentionedUser = mentionedUsers?.find(
        (user) => user.username.toLowerCase() === cleanedUsername?.toLowerCase()
      );
      if (!!mentionedUser) {
        return `[@${cleanedUsername}](/accounts/profile/${mentionedUser.id})`;
      }
      return match;
    }
  );
  return markdown;
}

/**
 * Returns commentId to focus on if id is provided and comment is not already rendered
 */
export function getCommentIdToFocusOn() {
  const match =
    typeof window !== "undefined" &&
    window.location.hash.match(/comment-(\d+)/);

  const focus_comment_id = match ? match[1] : undefined;
  // Check whether comment is already rendered. In this case we don't need to re-fetch the page
  const isCommentLoaded =
    focus_comment_id && document.getElementById(`comment-${focus_comment_id}`);

  if (focus_comment_id && !isCommentLoaded) return focus_comment_id;
}

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
    logError(error, "Failed to save comment draft");
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
    logError(error, "Failed to get comment draft");
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
    logError(error, "Failed to delete comment draft");
  }
};

export const cleanupCommentDrafts = (maxAgeDays = 14): void => {
  cleanupDrafts({
    keyPrefix: DRAFT_KEY_PREFIX,
    maxAgeDays,
    maxSizeMB: MAX_COMMENTS_DRAFT_SIZE_MB,
  });
};
