"use client";
import { FC } from "react";

import MainFeedFilters from "@/app/(main)/questions/components/fees_filters/main";
import MyQuestionsAndPostsFilters from "@/app/(main)/questions/components/fees_filters/my_questions_and_posts";
import {
  POST_FORECASTED_ID_FILTER,
  POST_USERNAMES_FILTER,
} from "@/constants/posts_feed";
import { useAuth } from "@/contexts/auth_context";
import useSearchParams from "@/hooks/use_search_params";

import MyPredictionsFilters from "./my_predictions";

const FeedFilters: FC = () => {
  const { params } = useSearchParams();
  const { user } = useAuth();

  if (user) {
    if (params.getAll(POST_FORECASTED_ID_FILTER).length) {
      return <MyPredictionsFilters />;
    }
    if (
      params.getAll(POST_USERNAMES_FILTER).every((obj) => obj === user.username)
    ) {
      return <MyQuestionsAndPostsFilters />;
    }
  }

  return <MainFeedFilters />;
};

export default FeedFilters;
