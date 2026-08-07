import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import QuestionTimeline from "../../question_view/consumer_question_view/timeline";

type Props = {
  post: PostWithForecasts;
};

// The chart's timeframe (zoom) buttons are hidden below md; force them visible
// so the mobile Timeline tab exposes the timeframe selector.
const TimelineTab: FC<Props> = ({ post }) => (
  <div className="[&_.ChartZoomControls]:flex">
    <QuestionTimeline
      postData={post}
      keyFactors={post.key_factors}
      isConsumerView
    />
  </div>
);

export default TimelineTab;
