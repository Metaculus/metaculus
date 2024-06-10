"use client";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import CommentStatus from "@/components/question_card/comment_status";
import PostVoter from "@/components/question_card/question_voter";
import QuestionStatus from "@/components/question_status";
import { Post } from "@/types/post";

type Props = {
  post: Post;
};

const BasicPostCard: FC<PropsWithChildren<Props>> = ({ post, children }) => {
  const { id, title } = post;

  return (
    <div className="rounded border border-blue-500 bg-gray-0 dark:border-blue-600 dark:bg-gray-0-dark">
      <Link href={`/questions/${id}`} className="block p-4 no-underline">
        <h4 className="relative mt-0 line-clamp-2 text-base font-semibold text-gray-900 dark:text-gray-900-dark">
          {title}
        </h4>
        {children}
      </Link>
      <div className="flex items-center justify-between gap-3 rounded-ee border-t border-blue-400 bg-blue-100 px-2 py-0.5 font-medium dark:border-blue-400-dark dark:bg-blue-100-dark">
        <div className="flex items-center gap-3 max-lg:flex-1 max-lg:justify-between">
          <div className="flex items-center gap-3">
            <PostVoter className="md:min-w-20" post={post} />
            <CommentStatus newCommentsCount={123000} url={`/questions/${id}`} />
          </div>

          <QuestionStatus question={post?.question} post={post} />
        </div>
      </div>
    </div>
  );
};

export default BasicPostCard;
