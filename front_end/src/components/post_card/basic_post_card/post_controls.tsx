"use client";

import { FC, PropsWithChildren } from "react";

import PostDefaultProject from "@/components/post_default_project";
import { Post } from "@/types/post";
import cn from "@/utils/core/cn";

import PostStatusRail from "./status_rail";

type Props = {
  post: Post;
  minimalistic?: boolean;
  onImage?: boolean;
};

const BasicPostControls: FC<PropsWithChildren<Props>> = ({
  post,
  minimalistic = false,
  onImage = false,
}) => {
  const defaultProject = post.projects?.default_project;
  // Edge case: if default_project is longer than 15 characters and there are unread messages
  const hasUnreadMessages = (post.unread_comment_count ?? 0) > 0;
  const projectNameLength = defaultProject?.name.length ?? 0;
  const shouldUseCompactPostStatus =
    projectNameLength >= 30 ||
    (hasUnreadMessages && projectNameLength > 15) ||
    minimalistic;

  return (
    <div
      className={cn(
        "mt-3 flex flex-1 items-center justify-between rounded-ee rounded-es @[680px]:flex-initial dark:border-blue-400-dark",
        onImage && "relative text-gray-0"
      )}
    >
      <PostStatusRail
        post={post}
        minimalistic={minimalistic}
        compactPostStatus={shouldUseCompactPostStatus}
      />
      <div className="hidden overflow-hidden @[680px]:inline-flex">
        {!minimalistic && defaultProject && (
          <PostDefaultProject defaultProject={defaultProject} />
        )}
      </div>
    </div>
  );
};

export default BasicPostControls;
