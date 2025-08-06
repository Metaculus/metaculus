import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { FC, useEffect, useState } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import { PostDropdownMenu } from "@/components/post_actions";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import PostVoter from "@/components/post_card/basic_post_card/post_voter";
import PostStatus from "@/components/post_status";
import Button from "@/components/ui/button";
import useContainerSize from "@/hooks/use_container_size";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import { extractPostResolution } from "@/utils/questions/resolution";

type Props = {
  post: PostWithForecasts;
  className?: string;
};

const QuestionHeaderInfo: FC<Props> = ({ post, className }) => {
  const resolutionData = extractPostResolution(post);
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const [shouldUseCompact, setShouldUseCompact] = useState(false);

  useEffect(() => {
    // Once it hits >500px, always keep it compact
    if (width > 500) {
      setShouldUseCompact(true);
    }
  }, [width]);

  return (
    <div
      className={cn(
        "mt-auto flex items-center justify-between gap-3",
        className
      )}
    >
      <div className="flex items-center gap-1.5 lg:gap-2" ref={ref}>
        <PostVoter post={post} />

        {/* CommentStatus - compact on small screens, full on large screens */}
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          className="bg-gray-200 px-2 dark:bg-gray-200-dark md:hidden"
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
          compact={shouldUseCompact}
        />

        {/* ForecastersCounter - compact on small screens, full on large screens */}
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          compact={true}
          className="font-bold md:hidden"
        />
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          compact={false}
          className="hidden md:flex"
        />
      </div>
      <div className="lg:hidden">
        <PostDropdownMenu
          post={post}
          button={
            <Button
              variant="tertiary"
              className="h-7 w-7 rounded-full border-blue-400 text-blue-700 dark:border-blue-400-dark dark:text-blue-700-dark"
              presentationType="icon"
            >
              <FontAwesomeIcon icon={faEllipsis} className="text-md" />
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default QuestionHeaderInfo;
