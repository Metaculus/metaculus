import { isNil } from "lodash";
import Link from "next/link";
import { FC, useState } from "react";

import Comment from "@/components/comment_feed/comment";
import { CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/cn";

import { SortOption } from ".";

type Props = {
  comment: CommentType;
  last_viewed_at?: string;
  profileId?: number;
  postData?: PostWithForecasts;
};

export const CommentWrapper: FC<Props> = ({
  comment,
  profileId,
  last_viewed_at,
  postData,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(
    comment.author.is_bot &&
      !isNil(comment.vote_score) &&
      comment.vote_score < 3
  );
  console.log(isCollapsed);
  return (
    <div
      key={comment.id}
      className={cn(
        "my-1.5 rounded-md border px-1.5 py-1 md:px-2.5 md:py-1.5",
        {
          "border-blue-400 dark:border-blue-400-dark": !(
            last_viewed_at &&
            new Date(last_viewed_at) < new Date(comment.created_at)
          ),
          "border-purple-500 bg-purple-100/50 dark:border-purple-500-dark/60 dark:bg-purple-100-dark/50":
            last_viewed_at &&
            new Date(last_viewed_at) < new Date(comment.created_at),
          "cursor-pointer hover:bg-blue-100 hover:dark:bg-blue-100-dark":
            isCollapsed,
        }
      )}
      onClick={() => (isCollapsed ? setIsCollapsed(!isCollapsed) : null)}
    >
      {profileId && comment.on_post_data && (
        <h3 className="mb-2 text-lg font-semibold">
          <Link
            href={`/questions/${comment.on_post_data.id}#comment-${comment.id}`}
            className="text-blue-700 no-underline hover:text-blue-800 dark:text-blue-600-dark hover:dark:text-blue-300"
          >
            {comment.on_post_data.title}
          </Link>
        </h3>
      )}
      <Comment
        onProfile={!!profileId}
        comment={comment}
        treeDepth={0}
        /* replies should always be sorted from oldest to newest */
        sort={"created_at" as SortOption}
        postData={postData}
        lastViewedAt={postData?.last_viewed_at}
        isCollapsed={isCollapsed}
      />
    </div>
  );
};
