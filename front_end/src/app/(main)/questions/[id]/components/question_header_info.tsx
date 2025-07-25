import { FC } from "react";

import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostStatus from "@/components/post_status";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

import ForecastersCounter from "../../components/forecaster_counter";

type Props = {
  post: PostWithForecasts;
  className?: string;
};

const QuestionHeaderInfo: FC<Props> = ({ post, className }) => {
  const resolutionData = extractPostResolution(post);

  // TODO: should we re-use this in Post Tiles?

  return (
    <div
      className={cn(
        "mt-auto flex items-center justify-between gap-3 font-medium",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <PostVoter post={post} />

        {/* CommentStatus - compact on small screens, full on large screens */}
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          className="bg-gray-200 dark:bg-gray-200-dark md:hidden"
          compact={true}
        />
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          className="hidden bg-gray-200 dark:bg-gray-200-dark md:flex"
          compact={false}
        />

        {/* PostStatus - compact on small screens, full on large screens (with edge case) */}
        <PostStatus
          post={post}
          resolution={resolutionData}
          compact={true}
          className="md:hidden"
        />
        <PostStatus
          post={post}
          resolution={resolutionData}
          className="hidden md:flex"
        />

        {/* ForecastersCounter - compact on small screens, full on large screens */}
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          compact={true}
          className="md:hidden"
        />
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          compact={false}
          className="hidden md:flex"
        />
      </div>
    </div>
  );
};

export default QuestionHeaderInfo;
