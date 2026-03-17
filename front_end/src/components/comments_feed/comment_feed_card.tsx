"use client";

import { FC } from "react";

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
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-blue-500 bg-gray-0 dark:border-blue-500-dark dark:bg-gray-0-dark"
      )}
    >
      <div className="flex flex-col md:flex-row">
        {/* Left column: Post preview (desktop only) */}
        <CommentPostPreview
          post={post}
          postTitle={comment.on_post_data?.title ?? ""}
          postId={comment.on_post ?? 0}
          className="hidden border-r border-blue-300 dark:border-blue-300-dark md:block md:w-[280px] md:min-w-[280px]"
        />

        {/* Right column: Comment */}
        <div className="min-w-0 flex-1">
          {/* Mobile: show post title */}
          <div className="block border-b border-blue-300 p-3 dark:border-blue-300-dark md:hidden">
            <a
              href={`/questions/${comment.on_post}/`}
              className="text-sm font-medium text-blue-800 hover:underline dark:text-blue-800-dark"
            >
              {comment.on_post_data?.title}
            </a>
          </div>

          <CommentCard
            comment={comment}
            votesScore={comment.vote_score ?? 0}
            changedMyMindCount={comment.changed_my_mind?.count ?? 0}
            keyFactorVotesScore={0}
            className="mt-0 border-none dark:border-none md:mt-0"
            expandOverride="collapsed"
          />
        </div>
      </div>
    </div>
  );
};

export default CommentFeedCard;
