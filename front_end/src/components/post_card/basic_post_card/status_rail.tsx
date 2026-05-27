"use client";

import { FC } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import PostStatus from "@/components/post_status";
import { Post } from "@/types/post";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

import CommentStatus from "./comment_status";
import PostVoter from "./post_voter";

type Props = {
  post: Post;
  minimalistic?: boolean;
  compactPostStatus?: boolean;
};

const PostStatusRail: FC<Props> = ({
  post,
  minimalistic = false,
  compactPostStatus = false,
}) => {
  const resolutionData = extractPostResolution(post);
  const postUrl = getPostLink(post);

  return (
    <div className="flex items-center gap-1.5 @[480px]:gap-2">
      {!minimalistic && <PostVoter post={post} />}

      <CommentStatus
        totalCount={post.comment_count ?? 0}
        unreadCount={post.unread_comment_count ?? 0}
        url={postUrl}
        className="bg-gray-200 @[480px]:hidden dark:bg-gray-200-dark"
        compact
      />
      <CommentStatus
        totalCount={post.comment_count ?? 0}
        unreadCount={post.unread_comment_count ?? 0}
        url={postUrl}
        className="hidden bg-gray-200 @[480px]:flex dark:bg-gray-200-dark"
        compact={false}
      />

      <PostStatus
        post={post}
        resolution={resolutionData}
        compact
        className="@[480px]:hidden"
      />
      <PostStatus
        post={post}
        resolution={resolutionData}
        compact={compactPostStatus}
        className="hidden @[480px]:flex"
      />

      <ForecastersCounter
        forecasters={post.nr_forecasters}
        compact
        className="@[480px]:hidden"
      />
      <ForecastersCounter
        forecasters={post.nr_forecasters}
        compact={minimalistic}
        className="hidden @[480px]:flex"
      />
    </div>
  );
};

export default PostStatusRail;
