"use client";
import { FC } from "react";

import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostStatus from "@/components/post_status";
import { PostWithForecasts } from "@/types/post";
import { extractPostStatus } from "@/utils/questions";

type Props = {
  post: PostWithForecasts;
};

const QuestionHeaderInfo: FC<Props> = ({ post }) => {
  const statusData = extractPostStatus(post);

  return (
    <div className="my-2 flex items-center justify-between gap-3 border-b border-t border-blue-500 font-medium dark:border-gray-500">
      <div className="flex items-center gap-2">
        <PostVoter className="md:min-w-20" post={post} />

        {!!statusData && (
          <PostStatus
            id={post.id}
            status={statusData.status}
            actualCloseTime={statusData.actualCloseTime}
            resolvedAt={statusData.resolvedAt}
            post={post}
          />
        )}

        <CommentStatus
          newCommentsCount={post.comment_count ? post.comment_count : 0}
          url={`/questions/${post.id}`}
        />
      </div>
    </div>
  );
};

export default QuestionHeaderInfo;
