import { FC } from "react";

import GroupOfQuestionsTile from "@/components/post_card/group_of_questions_tile";
import QuestionTile from "@/components/post_card/question_tile";
import { useHideCP } from "@/contexts/cp_context";
import { PostWithForecasts } from "@/types/post";
import {
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";

type Props = {
  post: PostWithForecasts;
};

const SimilarPredictionChip: FC<Props> = ({ post }) => {
  const { hideCP } = useHideCP();

  if (hideCP) {
    return;
  }

  if (isQuestionPost(post)) {
    return (
      <QuestionTile
        question={post.question}
        curationStatus={post.curation_status}
        authorUsername={post.author_username}
        hideCP={hideCP}
        canPredict={false}
        showChart={false}
      />
    );
  }

  if (isGroupOfQuestionsPost(post)) {
    return <GroupOfQuestionsTile post={post} showChart={false} />;
  }
};

export default SimilarPredictionChip;
