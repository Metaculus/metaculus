"use client";

import classNames from "classnames";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import PostDefaultProject from "@/components/post_default_project";
import PostStatus from "@/components/post_status";
import { Post } from "@/types/post";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions";

import CommentStatus from "./comment_status";
import PostVoter from "./post_voter";

type BorderVariant = "regular" | "highlighted";
type BorderColor = "blue" | "purple";

type Props = {
  post: Post;
  hideTitle?: boolean;
  borderVariant?: BorderVariant;
  borderColor?: BorderColor;
};

const BasicPostCard: FC<PropsWithChildren<Props>> = ({
  post,
  hideTitle = false,
  borderVariant = "regular",
  borderColor = "blue",
  children,
}) => {
  const { id, title } = post;
  const resolutionData = extractPostResolution(post);
  const defaultProject = post.projects.default_project;

  let newCommentsCount = post.comment_count ? post.comment_count : 0;
  if (post.unread_comment_count !== undefined) {
    newCommentsCount = post.unread_comment_count;
  }

  return (
    <div
      className={classNames(
        "rounded bg-gray-0 dark:bg-gray-0-dark",
        { regular: "border", highlighted: "border border-l-4" }[borderVariant],
        {
          blue: "border-blue-500 dark:border-blue-600",
          purple: "border-purple-500 dark:border-purple-500",
        }[borderColor]
      )}
    >
      <Link href={getPostLink(post)} className="block p-4 no-underline">
        {!hideTitle && (
          <h4 className="relative mb-3 mt-0 text-base font-semibold text-gray-900 dark:text-gray-900-dark">
            {title}
          </h4>
        )}
        {children}
      </Link>
      <div className="flex items-center justify-between rounded-ee rounded-es border-t border-blue-400 bg-blue-100 px-2 py-0.5 font-medium dark:border-blue-400-dark dark:bg-blue-100-dark max-lg:flex-1">
        <div className="flex items-center gap-3">
          <PostVoter className="md:min-w-20" post={post} />
          <CommentStatus
            newCommentsCount={newCommentsCount}
            url={`/questions/${id}`}
            commentColor={borderColor}
          />

          <PostStatus post={post} resolution={resolutionData} />
        </div>
        <div className="hidden lg:inline-flex">
          <PostDefaultProject defaultProject={defaultProject} />
        </div>
      </div>
    </div>
  );
};

export default BasicPostCard;
