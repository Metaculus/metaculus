import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import QuestionTimeline from "../../question_view/consumer_question_view/timeline";

type Props = {
  post: PostWithForecasts;
};

const TimelineTab: FC<Props> = ({ post }) => (
  <QuestionTimeline
    postData={post}
    keyFactors={post.key_factors}
    isConsumerView
  />
);

export default TimelineTab;
