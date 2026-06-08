"use client";

import { FC } from "react";

import LoadingSpinner from "@/components/ui/loading_spiner";
import { PostWithForecasts } from "@/types/post";

import SimilarQuestionsList from "../../sidebar/similar_questions/similar_questions_list";
import { useSimilarQuestions } from "../../sidebar/similar_questions/use_similar_questions";

type Props = {
  post: PostWithForecasts;
  variant?: "forecaster" | "consumer";
};

const SimilarQuestionsTab: FC<Props> = ({ post, variant }) => {
  const { questions, isLoading } = useSimilarQuestions(post, variant);

  if (isLoading) return <LoadingSpinner className="my-4" />;
  if (!questions.length) return null;

  return <SimilarQuestionsList questions={questions} variant={variant} />;
};

export default SimilarQuestionsTab;
