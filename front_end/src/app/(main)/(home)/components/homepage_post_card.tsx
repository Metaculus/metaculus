"use client";

import Link from "next/link";
import { FC } from "react";

import ForecastersCounter from "@/app/(main)/questions/components/forecaster_counter";
import ConsumerQuestionTile from "@/components/consumer_post_card/consumer_question_tile";
import GroupForecastCard from "@/components/consumer_post_card/group_forecast_card";
import CommentStatus from "@/components/post_card/basic_post_card/comment_status";
import PostCardErrorBoundary from "@/components/post_card/error_boundary";
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

const HomepagePostCard: FC<Props> = ({ post, className }) => {
  const { title } = post;

  return (
    <PostCardErrorBoundary>
      <div
        className={cn(
          "flex w-full break-inside-avoid items-start justify-start rounded border border-blue-400 bg-gray-0 px-4 py-5 no-underline @container dark:border-blue-400-dark dark:bg-gray-0-dark",
          className
        )}
      >
        <div className="relative z-0 flex w-full flex-col items-center gap-2.5 overflow-hidden">
          <div className="flex items-center justify-between">
            <CommentStatus
              totalCount={post.comment_count ?? 0}
              unreadCount={post.unread_comment_count ?? 0}
              url={getPostLink(post)}
              variant="gray"
              className="z-[101]"
            />
            <ForecastersCounter forecasters={post.nr_forecasters} />
          </div>
          <div className="flex w-full flex-col items-center gap-5 overflow-hidden no-underline @container">
            <h4 className="m-0 max-w-xl text-center text-sm font-medium md:text-base">
              {title}
            </h4>
            <HideCPProvider post={post}>
              {isQuestionPost(post) && !isMultipleChoicePost(post) && (
                <ConsumerQuestionTile question={post.question} />
              )}

              {(isGroupOfQuestionsPost(post) || isMultipleChoicePost(post)) && (
                <GroupForecastCard post={post} />
              )}
            </HideCPProvider>
          </div>
          <Link
            href={getPostLink(post)}
            className="absolute top-0 z-100 h-full w-full @container"
          />
        </div>
      </div>
    </PostCardErrorBoundary>
  );
};

export default HomepagePostCard;
