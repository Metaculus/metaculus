import { FC } from "react";

import ForecastCard from "@/components/forecast_card";
import PostsApi from "@/services/posts";

type Props = {
  postId: number;
};

const CardForecast: FC<Props> = async ({ postId }) => {
  const post = await PostsApi.getPost(postId);
  if (!post) return null;

  return <ForecastCard post={post} />;
};

export default CardForecast;
