"use client";
import { FC } from "react";

import MainFeedFilters from "@/components/filters/main_feed_filters";
import MyPredictionsFilters from "@/components/filters/my_predictions_filters";
import { POST_FORECASTED_ID_FILTER } from "@/constants/posts_feed";
import useSearchParams from "@/hooks/use_search_params";

const FeedFilters: FC = () => {
  const { params } = useSearchParams();

  if (params.getAll(POST_FORECASTED_ID_FILTER).length) {
    return <MyPredictionsFilters />;
  }

  return <MainFeedFilters />;
};

export default FeedFilters;
