"use client";

import Link from "next/link";
import { FC } from "react";

import PostCardErrorBoundary from "@/components/post_card/error_boundary";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";

import CompactPostCard from "./compact_post_card";

type Props = {
  post?: PostWithForecasts;
  postTitle: string;
  postId: number;
  isLoading: boolean;
  className?: string;
};

const CommentPostPreview: FC<Props> = ({
  post,
  postTitle,
  postId,
  isLoading,
  className,
}) => {
  if (post) {
    return (
      <PostCardErrorBoundary>
        <CompactPostCard post={post} className={className} />
      </PostCardErrorBoundary>
    );
  }

  return (
    <Link
      href={getPostLink({ id: postId })}
      className={cn(
        "flex max-h-[280px] min-h-[280px] flex-col justify-between gap-4 p-6 no-underline",
        className
      )}
    >
      <div className="flex h-6 gap-4">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-200-dark" />
      </div>
      <h4 className="m-0 text-base font-medium leading-5 text-gray-800 no-underline dark:text-gray-800-dark">
        {postTitle}
      </h4>
      <div className="my-auto flex flex-col items-center gap-3">
        <div className="h-[68px] w-[112px] animate-pulse rounded-t-full bg-gray-200 dark:bg-gray-200-dark" />
      </div>
    </Link>
  );
};

export default CommentPostPreview;
