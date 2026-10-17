import React, { FC } from "react";

import { shouldPostShowScores } from "@/app/(main)/questions/[id]/components/post_score_data/utils";
import { PostWithForecasts } from "@/types/post";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";

import ConditionalScoreData from "./conditional_score_data";
import GroupResolutionScores from "./group_resolution_score_data";
import MissingScoresAdminNote from "./missing_scores_admin_note";
import SingleQuestionScoreData from "./single_question_score_data";

type Props = {
  post: PostWithForecasts;
  isConsumerView?: boolean;
  noSectionWrapper?: boolean;
};

const ScoreData: FC<Props> = (props) => {
  const { post } = props;

  if (isGroupOfQuestionsPost(post)) {
    return <GroupResolutionScores {...props} />;
  }

  if (isConditionalPost(post)) {
    return <ConditionalScoreData {...props} />;
  }

  return <SingleQuestionScoreData {...props} />;
};

const PostScoreData: FC<Props> = (props) => {
  const { post } = props;

  return (
    <>
      {/* A resolved question with no scores is a state only admins can act on,
          so the note renders alongside the scores of any sibling questions */}
      <MissingScoresAdminNote post={post} />
      {shouldPostShowScores(post) && <ScoreData {...props} />}
    </>
  );
};

export default PostScoreData;
