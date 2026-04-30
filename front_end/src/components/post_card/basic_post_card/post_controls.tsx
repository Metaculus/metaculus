"use client";

import { FC, PropsWithChildren } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import PostDefaultProject from "@/components/post_default_project";
import PostStatus from "@/components/post_status";
import { Post } from "@/types/post";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

import CommentStatus from "./comment_status";
import PostVoter from "./post_voter";

type Props = {
  post: Post;
  minimalistic?: boolean;
};

const BasicPostControls: FC<PropsWithChildren<Props>> = ({
  post,
  minimalistic = false,
}) => {
  const resolutionData = extractPostResolution(post);
  const defaultProject = post.projects?.default_project;

  // Edge case: if default_project is longer than 15 characters and there are unread messages
  const hasUnreadMessages = (post.unread_comment_count ?? 0) > 0;
  const projectNameLength = defaultProject?.name.length ?? 0;

  const shouldUseCompactPostStatus =
    projectNameLength >= 30 ||
    (hasUnreadMessages && projectNameLength > 15) ||
    minimalistic;

  return (
    <div className="mt-3 flex flex-1 items-center justify-between rounded-ee rounded-es @[680px]:flex-initial dark:border-blue-400-dark">
      <div className="flex items-center gap-1.5 @[480px]:gap-2">
        {!minimalistic && <PostVoter post={post} />}

        {/* CommentStatus - compact on small screens, full on large screens */}
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          className="bg-gray-200 @[480px]:hidden dark:bg-gray-200-dark"
          compact={true}
        />
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          className="hidden bg-gray-200 @[480px]:flex dark:bg-gray-200-dark"
          compact={false}
        />

        {/* PostStatus - compact on small screens, full on large screens (with edge case) */}
        <PostStatus
          post={post}
          resolution={resolutionData}
          compact={true}
          className="@[480px]:hidden"
        />
        <PostStatus
          post={post}
          resolution={resolutionData}
          compact={shouldUseCompactPostStatus}
          className="hidden @[480px]:flex"
        />

        {/* ForecastersCounter - compact on small screens, full on large screens */}
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          compact={true}
          className="@[480px]:hidden"
        />
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          compact={minimalistic}
          className="hidden @[480px]:flex"
        />
      </div>
      <div className="hidden overflow-hidden @[680px]:inline-flex">
        {!minimalistic && defaultProject && (
          <PostDefaultProject defaultProject={defaultProject} />
        )}
      </div>
    </div>
  );
};

export default BasicPostControls;
