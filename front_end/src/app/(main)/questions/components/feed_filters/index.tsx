"use client";
import { FC } from "react";

import MainFeedFilters from "@/app/(main)/questions/components/feed_filters/main";
import MyQuestionsAndPostsFilters from "@/app/(main)/questions/components/feed_filters/my_questions_and_posts";
import useFeed from "@/app/(main)/questions/hooks/use_feed";
import { FeedType } from "@/constants/posts_feed";

import MyPredictionsFilters from "./my_predictions";

type Props = { withProjectFilters?: boolean };

const FeedFilters: FC<Props> = ({ withProjectFilters }) => {
  const { currentFeed } = useFeed();
  const panelClassname = "sm:w-[370px] md:w-[500px]";

  switch (currentFeed) {
    case FeedType.MY_PREDICTIONS:
      return <MyPredictionsFilters panelClassname={panelClassname} />;
    case FeedType.MY_QUESTIONS_AND_POSTS:
      return <MyQuestionsAndPostsFilters panelClassname={panelClassname} />;
    case FeedType.FOLLOWING:
      return <MainFeedFilters following panelClassname={panelClassname} />;
    default:
      return (
        <MainFeedFilters
          withProjectFilters={withProjectFilters}
          panelClassname={panelClassname}
        />
      );
  }
};

export default FeedFilters;
