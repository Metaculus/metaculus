import { AuthorType, BECommentType, CommentType } from "@/types/comment";

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
    mentioned_users: comment.mentioned_users,
  };
}

export function parseUserMentions(
  markdown: string,
  mentionedUsers?: AuthorType[]
): string {
  const userTagPattern = /(?<!\[[^\]]*)@(\(([^)]+)\)|(\w+))/g;

  markdown = markdown.replace(
    userTagPattern,
    (match, _group1, group2, group3) => {
      const cleanedUsername = (group2 || group3).replace(/[@()]/g, "");
      switch (cleanedUsername) {
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
