"use client";
import classNames from "classnames";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import PostStatus from "@/components/post_status";
import { Post } from "@/types/post";
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

  return (
    <div
      className={classNames(
        "rounded  bg-gray-0 dark:bg-gray-0-dark",
        { regular: "border", highlighted: "border border-l-4" }[borderVariant],
        {
          blue: "border-blue-500 dark:border-blue-600",
          purple: "border-purple-500 dark:border-purple-500",
        }[borderColor]
      )}
    >
      <Link href={`/questions/${id}`} className="block p-4 no-underline">
        {!hideTitle && (
          <h4 className="relative mt-0 line-clamp-2 text-base font-semibold text-gray-900 dark:text-gray-900-dark">
            {title}
          </h4>
        )}
        {children}
      </Link>

      <div className="flex items-center justify-between gap-3 rounded-ee border-t border-blue-400 bg-blue-100 px-2 py-0.5 font-medium dark:border-blue-400-dark dark:bg-blue-100-dark">
        <div className="flex items-center gap-3 max-lg:flex-1 max-lg:justify-between">
          <div className="flex items-center gap-3">
            <PostVoter className="md:min-w-20" post={post} />
            <CommentStatus
              newCommentsCount={post.comment_count ? post.comment_count : 0}
              url={`/questions/${id}`}
              commentColor={borderColor}
            />
          </div>

          <PostStatus post={post} resolution={resolutionData} />
        </div>
      </div>
    </div>
  );
};

export default BasicPostCard;
