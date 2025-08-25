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
      <div className="max-w-[100px]">
        <QuestionTile
          question={post.question}
          curationStatus={post.curation_status}
          authorUsername={post.author_username}
          hideCP={hideCP}
          canPredict={false}
          showChart={false}
        />
      </div>
    );
  }

  if (isGroupOfQuestionsPost(post)) {
    return (
      <div className="w-full">
        <GroupOfQuestionsTile post={post} showChart={false} />
      </div>
    );
  }
};

export default SimilarPredictionChip;
