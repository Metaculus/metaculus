"use client";
import { FC } from "react";

import MainFeedFilters from "@/app/(main)/questions/components/fees_filters/main";
import MyQuestionsAndPostsFilters from "@/app/(main)/questions/components/fees_filters/my_questions_and_posts";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import { FeedType } from "@/constants/posts_feed";

import MyPredictionsFilters from "./my_predictions";

const FeedFilters: FC = () => {
  const { currentFeed } = useFeed();

  switch (currentFeed) {
    case FeedType.MY_PREDICTIONS:
      return <MyPredictionsFilters />;
    case FeedType.MY_QUESTIONS_AND_POSTS:
      return <MyQuestionsAndPostsFilters />;
    default:
      return <MainFeedFilters />;
  }
};

export default FeedFilters;
