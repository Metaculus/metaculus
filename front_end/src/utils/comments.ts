import { userTagPattern } from "@/constants/comments";
import { AuthorType, BECommentType, CommentType } from "@/types/comment";

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
    edited_at: comment.edited_at,
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
