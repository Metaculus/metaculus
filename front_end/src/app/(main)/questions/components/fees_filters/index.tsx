"use client";
import { FC } from "react";

import MainFeedFilters from "@/app/(main)/questions/components/fees_filters/main";
import { POST_FORECASTED_ID_FILTER } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";

import MyPredictionsFilters from "./my_predictions";

const FeedFilters: FC = () => {
  const { params } = useSearchParams();

  if (params.getAll(POST_FORECASTED_ID_FILTER).length) {
    return <MyPredictionsFilters />;
  }

  return <MainFeedFilters />;
};

export default FeedFilters;
