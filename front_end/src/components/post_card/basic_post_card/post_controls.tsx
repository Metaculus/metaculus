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
};

const BasicPostControls: FC<PropsWithChildren<Props>> = ({ post }) => {
  const resolutionData = extractPostResolution(post);
  const defaultProject = post.projects.default_project;

  return (
    <div className="mt-4 flex items-center justify-between rounded-ee rounded-es dark:border-blue-400-dark max-lg:flex-1">
      <div className="flex items-center gap-1.5 md:gap-2">
        <PostVoter post={post} />
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          className="bg-gray-200 dark:bg-gray-200-dark"
        />
        <PostStatus post={post} resolution={resolutionData} />
        <ForecastersCounter forecasters={post.nr_forecasters} />
      </div>
      <div className="hidden lg:inline-flex">
        <PostDefaultProject defaultProject={defaultProject} />
      </div>
    </div>
  );
};

export default BasicPostControls;
