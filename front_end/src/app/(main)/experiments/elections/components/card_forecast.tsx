import { FC } from "react";

import ForecastCard from "@/components/forecast_card";
import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { TimelineChartZoomOption } from "@/types/charts";

type Props = {
  postId: number;
};

const CardForecast: FC<Props> = async ({ postId }) => {
  const post = await ServerPostsApi.getPostAnonymous(postId, {
    next: { revalidate: 900 },
  });
  if (!post) return null;

  return (
    <ForecastCard
      post={post}
      defaultChartZoom={TimelineChartZoomOption.TwoMonths}
    />
  );
};

export default WithServerComponentErrorBoundary(CardForecast);
