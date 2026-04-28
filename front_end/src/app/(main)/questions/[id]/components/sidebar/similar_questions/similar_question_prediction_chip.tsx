"use client";

import { FC } from "react";

import GroupOfQuestionsTile from "@/components/post_card/group_of_questions_tile";
import QuestionTile from "@/components/post_card/question_tile";
import { useHideCP } from "@/contexts/cp_context";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
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
    const isBinary = post.question?.type === QuestionType.Binary;
    return (
      <div className="w-full">
        <QuestionTile
          question={post.question}
          curationStatus={post.curation_status}
          authorUsername={post.author_username}
          hideCP={hideCP}
          canPredict={false}
          showChart={!isBinary}
        />
      </div>
    );
  }

  if (isGroupOfQuestionsPost(post)) {
    return (
      <div className="w-full">
        <GroupOfQuestionsTile post={post} />
      </div>
    );
  }
};

export default SimilarPredictionChip;
