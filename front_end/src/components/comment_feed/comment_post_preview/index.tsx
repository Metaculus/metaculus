"use client";

import { FC } from "react";

import PostCardErrorBoundary from "@/components/post_card/error_boundary";
import { PostWithForecasts } from "@/types/post";

import CompactCommentPostCard from "./compact_comment_post_card";
import CompactCommentPostCardSkeleton from "./compact_comment_post_card_skeleton";

type Props = {
  post?: PostWithForecasts;
  postTitle: string;
  postId: number;
  className?: string;
};

const CommentPostPreview: FC<Props> = ({
  post,
  postTitle,
  postId,
  className,
}) => {
  if (post) {
    return (
      <PostCardErrorBoundary>
        <CompactCommentPostCard post={post} className={className} />
      </PostCardErrorBoundary>
    );
  }

  return (
    <CompactCommentPostCardSkeleton
      postTitle={postTitle}
      postId={postId}
      className={className}
    />
  );
};

export default CommentPostPreview;
