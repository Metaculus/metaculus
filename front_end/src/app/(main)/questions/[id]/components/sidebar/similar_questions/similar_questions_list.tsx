import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import SimilarQuestion from "./similar_question_card";

interface Props {
  questions: PostWithForecasts[];
  variant?: "forecaster" | "consumer";
}

const SimilarQuestionsList: FC<Props> = ({ questions, variant }) => {
  return (
    <div className="flex w-full flex-col gap-3">
      {questions.map((question: PostWithForecasts) => (
        <SimilarQuestion key={question.id} post={question} variant={variant} />
      ))}
    </div>
  );
};

export default SimilarQuestionsList;
