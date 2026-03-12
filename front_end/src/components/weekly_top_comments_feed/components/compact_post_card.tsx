"use client";

import Link from "next/link";
import { FC } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import ConsumerQuestionTile from "@/components/consumer_post_card/consumer_question_tile";
import GroupForecastCard from "@/components/consumer_post_card/group_forecast_card";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import HideCPProvider from "@/contexts/cp_context";
import { PostWithForecasts } from "@/types/post";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
  className?: string;
};

const CompactPostCard: FC<Props> = ({ post, className }) => {
  return (
    <Link
      href={getPostLink(post)}
      className={cn(
        "flex flex-col justify-between gap-3 p-6 no-underline",
        className
      )}
    >
      <h4 className="m-0 text-base font-medium text-gray-800 no-underline dark:text-gray-800-dark">
        {post.title}
      </h4>

      <HideCPProvider post={post}>
        <div className="my-auto flex flex-col items-center">
          {isQuestionPost(post) && !isMultipleChoicePost(post) && (
            <ConsumerQuestionTile question={post.question} />
          )}
          {(isGroupOfQuestionsPost(post) || isMultipleChoicePost(post)) && (
            <GroupForecastCard post={post} />
          )}
        </div>
      </HideCPProvider>

      <div className="mt-auto flex items-center gap-2">
        <CommentStatus
          totalCount={post.comment_count ?? 0}
          unreadCount={post.unread_comment_count ?? 0}
          url={getPostLink(post)}
          variant="gray"
          className="pl-0 md:pl-0"
        />
        <ForecastersCounter
          forecasters={post.nr_forecasters}
          className="px-0 md:px-0"
        />
      </div>
    </Link>
  );
};

export default CompactPostCard;
