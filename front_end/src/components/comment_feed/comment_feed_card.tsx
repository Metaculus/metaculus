"use client";

import { FC, memo, useCallback } from "react";

import CommentCard from "@/components/comment_feed/comment_card";
import CommentPostPreview from "@/components/comment_feed/comment_post_preview";
import { CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";

type Props = {
  comment: CommentType;
  post?: PostWithForecasts;
};

const CommentFeedCard: FC<Props> = ({ comment, post }) => {
  const handleViewComment = useCallback(() => {
    window.open(
      `/questions/${comment.on_post}/#comment-${comment.id}`,
      "_blank"
    );
  }, [comment.on_post, comment.id]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-blue-500 bg-gray-0 dark:border-blue-500-dark dark:bg-gray-0-dark"
      )}
    >
      <div className="flex flex-col md:flex-row">
        {/* Left column: Post preview (desktop only) */}
        <div className="hidden items-start rounded-l border-r md:flex md:w-[280px] md:shrink-0">
          <CommentPostPreview
            post={post}
            postTitle={comment.on_post_data?.title ?? ""}
            postId={comment.on_post ?? 0}
            className="w-full"
          />
        </div>

        {/* Right column: Comment */}
        <div className="min-w-0 flex-1">
          <CommentCard
            comment={comment}
            votesScore={comment.vote_score ?? 0}
            changedMyMindCount={comment.changed_my_mind?.count ?? 0}
            keyFactorVotesScore={comment.key_factor_votes_score ?? 0}
            className="mt-0 border-none dark:border-none md:mt-0"
            expandOverride="collapsed"
            collapsedHeight={222}
            onViewComment={handleViewComment}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(CommentFeedCard);
