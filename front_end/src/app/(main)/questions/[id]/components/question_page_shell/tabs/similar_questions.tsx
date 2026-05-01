"use client";

import { FC } from "react";

import { PostWithForecasts } from "@/types/post";

import SimilarQuestionsList from "../../sidebar/similar_questions/similar_questions_list";

type Props = {
  questions: PostWithForecasts[];
  variant?: "forecaster" | "consumer";
};

const SimilarQuestionsTab: FC<Props> = ({ questions, variant }) => {
  if (!questions.length) return null;

  return <SimilarQuestionsList questions={questions} variant={variant} />;
};

export default SimilarQuestionsTab;
