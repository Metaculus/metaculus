"use client";

import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";

import BasicConsumerPostCard from "@/components/consumer_post_card/basic_consumer_post_card";
import ConsumerPredictionInfo from "@/components/consumer_post_card/prediction_info";
import PostCardErrorBoundary from "@/components/post_card/error_boundary";
import HideCPProvider from "@/contexts/cp_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import {
  getGroupForecastAvailability,
  getQuestionForecastAvailability,
} from "@/utils/questions/forecastAvailability";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type BorderVariant = "regular" | "highlighted";
type BorderColor = "blue" | "purple";

type Props = {
  post: PostWithForecasts;
  hideTitle?: boolean;
  borderVariant?: BorderVariant;
  borderColor?: BorderColor;
  forCommunityFeed?: boolean;
};

const ConsumerPostCard: FC<PropsWithChildren<Props>> = ({
  post,
  forCommunityFeed,
}) => {
  const t = useTranslations();
  const forecastAvailability = getPostForecastAvailability(post);

  return (
    <PostCardErrorBoundary>
      <BasicConsumerPostCard post={post} forCommunityFeed={forCommunityFeed}>
        <HideCPProvider post={post}>
          <ConsumerPredictionInfo
            post={post}
            forecastAvailability={forecastAvailability}
          />
          {[PostStatus.PENDING_RESOLUTION, PostStatus.CLOSED].includes(
            post.status
          ) && (
            <p className="m-0 text-center text-xs font-normal leading-4 text-gray-1000 text-opacity-50 @[500px]:text-left dark:text-gray-1000-dark dark:text-opacity-50">
              {t("closedForForecastingShortDescription")}
            </p>
          )}
        </HideCPProvider>
      </BasicConsumerPostCard>
    </PostCardErrorBoundary>
  );
};

function getPostForecastAvailability(post: PostWithForecasts) {
  if (isQuestionPost(post)) {
    return getQuestionForecastAvailability(post.question);
  } else if (isGroupOfQuestionsPost(post)) {
    return getGroupForecastAvailability(post.group_of_questions.questions);
  }
  return null;
}

export default ConsumerPostCard;
