import React, { FC } from "react";

import { PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import ConditionalScoreData from "./conditional_score_data";
import GroupResolutionScores from "./group_resolution_score_data";
import SingleQuestionScoreData from "./single_question_score_data";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
  noSectionWrapper?: boolean;
};

const PostScoreData: FC<Props> = (props) => {
  const { post } = props;

  if (isGroupOfQuestionsPost(post)) {
    return <GroupResolutionScores post={post} />;
  }

  if (isConditionalPost(post)) {
    return <ConditionalScoreData {...props} />;
  }

  return <SingleQuestionScoreData {...props} />;
};

export default PostScoreData;
