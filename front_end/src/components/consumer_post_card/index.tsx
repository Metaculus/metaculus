"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import BasicConsumerPostCard from "@/components/consumer_post_card/basic_consumer_post_card";
import GroupForecastCard from "@/components/consumer_post_card/group_forecast_card";
import PostCardErrorBoundary from "@/components/post_card/error_boundary";
import NotebookTile from "@/components/post_card/notebook_tile";
import HideCPProvider from "@/contexts/cp_context";
import { PostStatus, PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isMultipleChoicePost,
  isNotebookPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

import ConsumerQuestionTile from "./consumer_question_tile";

type BorderVariant = "regular" | "highlighted";
type BorderColor = "blue" | "purple";

type Props = {
  post: PostWithForecasts;
  hideTitle?: boolean;
  borderVariant?: BorderVariant;
  borderColor?: BorderColor;
  forCommunityFeed?: boolean;
  indexWeight?: number;
  forFeedPage?: boolean;
  useShortTitle?: boolean;
};

const ConsumerPostCard: FC<Props> = ({
  post,
  forCommunityFeed,
  indexWeight,
  forFeedPage = false,
  useShortTitle = false,
}) => {
  const t = useTranslations();

  const notebookImageUrl =
    isNotebookPost(post) && post.notebook.image_url?.startsWith("https:")
      ? post.notebook.image_url
      : undefined;

  return (
    <PostCardErrorBoundary>
      <BasicConsumerPostCard
        post={post}
        forCommunityFeed={forCommunityFeed}
        indexWeight={indexWeight}
        isNotebook={isNotebookPost(post)}
        backgroundImageUrl={notebookImageUrl}
        useShortTitle={useShortTitle}
      >
        <HideCPProvider post={post}>
          {isNotebookPost(post) && notebookImageUrl && (
            <div className="w-full text-left">
              <NotebookTile post={post} fullBackground />
            </div>
          )}

          {isQuestionPost(post) && !isMultipleChoicePost(post) && (
            <ConsumerQuestionTile question={post.question} />
          )}

          {(isGroupOfQuestionsPost(post) || isMultipleChoicePost(post)) && (
            <div className="w-full">
              <GroupForecastCard
                post={post}
                buttonVariant="minimal"
                forFeedPage={forFeedPage}
              />
            </div>
          )}

          {[PostStatus.PENDING_RESOLUTION, PostStatus.CLOSED].includes(
            post.status
          ) && (
            <p className="m-0 text-center text-sm font-normal leading-4 text-gray-1000 text-opacity-50 @[500px]:text-left dark:text-gray-1000-dark dark:text-opacity-50">
              {t("closedForForecastingShortDescription")}
            </p>
          )}
        </HideCPProvider>
      </BasicConsumerPostCard>
    </PostCardErrorBoundary>
  );
};

export default ConsumerPostCard;
