import { isNil } from "lodash";
import { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import { getGroupForecastAvailability } from "@/utils/questions/forecastAvailability";

import GroupForecastCard from "../group_forecast_card";
import UpcomingCP from "../upcoming_cp";

type Props = {
  post: PostWithForecasts;
};

const ConsumerGroupOfQuestionsTile: FC<Props> = ({ post }) => {
  const forecastAvailability = getGroupForecastAvailability(
    post.group_of_questions?.questions || []
  );

  // CP hidden
  if (!isNil(forecastAvailability?.cpRevealsOn)) {
    return <UpcomingCP cpRevealsOn={forecastAvailability.cpRevealsOn} />;
  }

  // CP empty
  if (forecastAvailability?.isEmpty) {
    return null;
  }

  return <GroupForecastCard post={post} />;
};

export default ConsumerGroupOfQuestionsTile;
