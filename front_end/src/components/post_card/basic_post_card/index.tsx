"use client";
import Link from "next/link";
import { FC, PropsWithChildren, useMemo } from "react";

import PostStatus from "@/components/post_status";
import { Post } from "@/types/post";

import CommentStatus from "./comment_status";
import PostVoter from "./post_voter";

type Props = {
  post: Post;
  hideTitle?: boolean;
};

const BasicPostCard: FC<PropsWithChildren<Props>> = ({
  post,
  hideTitle = false,
  children,
}) => {
  const { id, title } = post;

  const statusData = useMemo(() => {
    if (post.question) {
      return {
        status: post.curation_status,
        closedAt: post.question.closed_at,
        resolvedAt: post.question.resolved_at,
      };
    }

    if (post.conditional) {
      return {
        status: post.conditional.condition.curation_status,
        closedAt: post.conditional.condition.closed_at,
        resolvedAt: post.conditional.condition.resolved_at,
      };
    }

    return null;
  }, [post.conditional, post.question]);

  return (
    <div className="rounded border border-blue-500 bg-gray-0 dark:border-blue-600 dark:bg-gray-0-dark">
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
            <CommentStatus newCommentsCount={123000} url={`/questions/${id}`} />
          </div>

          {!!statusData && (
            <PostStatus
              id={post.id}
              status={statusData.status}
              closedAt={statusData.closedAt}
              resolvedAt={statusData.resolvedAt}
              post={post}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BasicPostCard;
