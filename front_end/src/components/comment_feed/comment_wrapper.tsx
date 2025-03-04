"use client";

import { isNil } from "lodash";
import Link from "next/link";
import { FC, useState } from "react";

import Comment from "@/components/comment_feed/comment";
import { CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/cn";

import { SortOption } from ".";

type Props = {
  comment: CommentType;
  last_viewed_at?: string;
  profileId?: number;
  handleCommentPin?: (comment: CommentType) => void;
  postData?: PostWithForecasts;
};

export const CommentWrapper: FC<Props> = ({
  comment,
  profileId,
  last_viewed_at,
  postData,
  handleCommentPin,
}) => {
  const isUnread =
    last_viewed_at && new Date(last_viewed_at) < new Date(comment.created_at);
  const match = window.location.hash.match(/#comment-(\d+)/);
  const [isCollapsed, setIsCollapsed] = useState(
    isCommentCollapsed(comment, match)
  );

  const { is_pinned } = comment;

  return (
    <div
      key={comment.id}
      className={cn("my-1.5 rounded-md border px-1.5 py-1 md:px-3 md:py-2", {
        "dark:blue-300/70-dark border-blue-500 bg-blue-300/70 dark:border-blue-500-dark":
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
      />
    </div>
  );
};

function isCommentCollapsed(
  comment: CommentType,
  match: RegExpMatchArray | null
) {
  if (comment.id === 277759) return true;

  // Don't collapse pinned comments
  if (comment.is_pinned) return false;

  if (match) {
    const focus_comment_id = Number(match[1]);
    if (focus_comment_id === comment.id) {
      return false;
    }
  }

  if (comment.author.is_bot) {
    return !isNil(comment.vote_score) && comment.vote_score < 3;
  }

  return !isNil(comment.vote_score) && comment.vote_score <= -3;
}
