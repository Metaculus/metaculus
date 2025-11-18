"use client";

import { isNil } from "lodash";
import Link from "next/link";
import { FC, useState } from "react";

import { KeyFactorsProvider } from "@/app/(main)/questions/[id]/components/key_factors/key_factors_context";
import Comment from "@/components/comment_feed/comment";
import { useAuth } from "@/contexts/auth_context";
import { CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

import { SortOption } from ".";

type Props = {
  comment: CommentType;
  last_viewed_at?: string;
  profileId?: number;
  handleCommentPin?: (comment: CommentType) => Promise<void>;
  postData?: PostWithForecasts;
  suggestKeyFactorsOnFirstRender?: boolean;
  shouldSuggestKeyFactors?: boolean;
};

export const CommentWrapper: FC<Props> = ({
  comment,
  profileId,
  last_viewed_at,
  postData,
  handleCommentPin,
  suggestKeyFactorsOnFirstRender = false,
  shouldSuggestKeyFactors = false,
}) => {
  const { user } = useAuth();
  const isUnread =
    last_viewed_at && new Date(last_viewed_at) < new Date(comment.created_at);
  const match = window.location.hash.match(/#comment-(\d+)/);
  const commentToFocusOn = match ? Number(match[1]) : null;
  const isFocusedCommentInTree = commentToFocusOn
    ? hasCommentInTree(comment.children, commentToFocusOn)
    : false;
  const [isCollapsed, setIsCollapsed] = useState(
    isFocusedCommentInTree
      ? false
      : isCommentCollapsed(comment, commentToFocusOn)
  );

  const { is_pinned } = comment;

  return (
    <div
      key={comment.id}
      className={cn("my-1.5 rounded-md border px-1.5 py-1 md:px-3 md:py-2", {
        "border-blue-500 bg-blue-300/70 dark:border-blue-500-dark dark:bg-blue-300-dark/70":
          is_pinned,
        "border-blue-400 dark:border-blue-400-dark": !isUnread && !is_pinned,
        "border-purple-500 bg-purple-100/50 dark:border-purple-500-dark/60 dark:bg-purple-100-dark/50":
          isUnread && !is_pinned,
        "cursor-pointer hover:bg-blue-100 hover:dark:bg-blue-100-dark":
          isCollapsed,
      })}
      onClick={() => (isCollapsed ? setIsCollapsed(!isCollapsed) : null)}
    >
      {profileId && comment.on_post_data && (
        <h3 className="mb-2 text-lg font-semibold">
          <Link
            href={`/questions/${comment.on_post_data.id}#comment-${comment.id}`}
            className="text-blue-700 no-underline hover:text-blue-800 dark:text-blue-600-dark hover:dark:text-blue-300"
          >
            {comment.on_post_data.title}
          </Link>
        </h3>
      )}
      <KeyFactorsProvider
        user={user}
        post={postData}
        commentId={comment.id}
        suggest={shouldSuggestKeyFactors && suggestKeyFactorsOnFirstRender}
      >
        <Comment
          onProfile={!!profileId}
          comment={comment}
          handleCommentPin={handleCommentPin}
          treeDepth={0}
          /* replies should always be sorted from oldest to newest */
          sort={"created_at" as SortOption}
          postData={postData}
          lastViewedAt={postData?.last_viewed_at}
          isCollapsed={isCollapsed}
          isCommentJustCreated={suggestKeyFactorsOnFirstRender}
          shouldSuggestKeyFactors={shouldSuggestKeyFactors}
          forceExpandedChildren={isFocusedCommentInTree}
        />
      </KeyFactorsProvider>
    </div>
  );
};

function isCommentCollapsed(
  comment: CommentType,
  commentToFocusOn: null | number
) {
  // Don't collapse pinned comments
  if (comment.is_pinned) return false;
  // Don't collapse if parent of children comment hash is in the link
  if (commentToFocusOn) {
    if (commentToFocusOn === comment.id) {
      return false;
    }
  }

  if (comment.author.is_bot) {
    return !isNil(comment.vote_score) && comment.vote_score < 3;
  }

  return !isNil(comment.vote_score) && comment.vote_score <= -3;
}

function hasCommentInTree(comments: CommentType[], targetId: number): boolean {
  for (const comment of comments) {
    if (comment.id === targetId) return true;
    if (comment.children && comment.children.length > 0) {
      if (hasCommentInTree(comment.children, targetId)) return true;
    }
  }
  return false;
}
