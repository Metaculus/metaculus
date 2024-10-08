import { FC } from "react";

import ForecastCard from "@/components/forecast_card";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import PostsApi from "@/services/posts";
import { TimelineChartZoomOption } from "@/types/charts";

type Props = {
  postId: number;
};

const CardForecast: FC<Props> = async ({ postId }) => {
  const post = await PostsApi.getPostAnonymous(postId);
  if (!post) return null;

  return (
    <ForecastCard
      post={post}
      defaultChartZoom={TimelineChartZoomOption.TwoMonths}
    />
  );
};

export default WithServerComponentErrorBoundary(CardForecast);
