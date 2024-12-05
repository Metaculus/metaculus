"use client";
import { FC } from "react";

import InReviewFeed from "@/app/(main)/questions/components/feed_filters/in_review";
import MainFeedFilters from "@/app/(main)/questions/components/feed_filters/main";
import MyQuestionsAndPostsFilters from "@/app/(main)/questions/components/feed_filters/my_questions_and_posts";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import { FeedType } from "@/constants/posts_feed";

import MyPredictionsFilters from "./my_predictions";

type Props = {
  forFeedHome?: boolean;
};

const FeedFilters: FC<Props> = ({ forFeedHome = true }) => {
  const { currentFeed } = useFeed();

  switch (currentFeed) {
    case FeedType.MY_PREDICTIONS:
      return <MyPredictionsFilters />;
    case FeedType.MY_QUESTIONS_AND_POSTS:
      return <MyQuestionsAndPostsFilters />;
    case FeedType.IN_REVIEW:
      return <InReviewFeed />;
    default:
      return <MainFeedFilters forFeedHome={forFeedHome} />;
  }
};

export default FeedFilters;
