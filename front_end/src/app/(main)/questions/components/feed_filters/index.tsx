"use client";

import dynamic from "next/dynamic";
import { FC } from "react";

import MyQuestionsAndPostsFilters from "@/app/(main)/questions/components/feed_filters/my_questions_and_posts";
import { useFeedQuery } from "@/app/(main)/questions/hooks/use_feed_query";
import { FeedType } from "@/constants/posts_feed";

import MyPredictionsFilters from "./my_predictions";

const MainFeedFilters = dynamic(
  () => import("@/app/(main)/questions/components/feed_filters/main"),
  {
    ssr: false,
  }
);

type Props = {
  withProjectFilters?: boolean;
  variant?: "full" | "mobileActions";
  hideMobileActions?: boolean;
};

const FeedFilters: FC<Props> = ({
  withProjectFilters,
  variant,
  hideMobileActions,
}) => {
  const { currentFeed } = useFeedQuery();
  const panelClassname = "sm:w-[370px] md:w-[500px]";

  switch (currentFeed) {
    case FeedType.MY_PREDICTIONS:
      return (
        <MyPredictionsFilters
          panelClassname={panelClassname}
          variant={variant}
          hideMobileActions={hideMobileActions}
        />
      );
    case FeedType.MY_QUESTIONS_AND_POSTS:
      return (
        <MyQuestionsAndPostsFilters
          panelClassname={panelClassname}
          variant={variant}
          hideMobileActions={hideMobileActions}
        />
      );
    case FeedType.FOLLOWING:
      return (
        <MainFeedFilters
          following
          panelClassname={panelClassname}
          variant={variant}
          hideMobileActions={hideMobileActions}
        />
      );
    default:
      return (
        <MainFeedFilters
          withProjectFilters={withProjectFilters}
          panelClassname={panelClassname}
          variant={variant}
          hideMobileActions={hideMobileActions}
        />
      );
  }
};

export default FeedFilters;
