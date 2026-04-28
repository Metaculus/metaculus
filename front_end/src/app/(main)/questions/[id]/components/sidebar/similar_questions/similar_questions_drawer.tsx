import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import SimilarQuestion from "./similar_question_card";

interface Props {
  questions: PostWithForecasts[];
}

const SimilarQuestionsDrawer: FC<Props> = ({ questions }) => {
  return (
    <div className="flex w-full flex-col gap-3">
      {questions.map((question: PostWithForecasts) => (
        <SimilarQuestion key={question.id} post={question} />
      ))}
    </div>
  );
};

export default SimilarQuestionsDrawer;
