"use client";

import { FC } from "react";

import { PromoTile } from "@/components/promo_tiles";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { PostWithForecasts } from "@/types/post";

import SimilarQuestionsList from "./similar_questions_list";
import { useSidebarTile } from "./use_sidebar_tile";
import { useSimilarQuestions } from "./use_similar_questions";

type Props = {
  post: PostWithForecasts;
  variant?: "forecaster" | "consumer";
};

const SimilarQuestions: FC<Props> = ({ post, variant }) => {
  const { questions, isLoading: isQuestionsLoading } = useSimilarQuestions(
    post,
    variant
  );
  const { tile, onDismiss, isLoading: isTileLoading } = useSidebarTile(post);

  if (isQuestionsLoading || isTileLoading)
    return <LoadingSpinner className="my-4" />;
  if (!questions.length && !tile) return null;

  return (
    <div className="flex flex-col gap-4">
      {tile && <PromoTile tile={tile} onDismiss={onDismiss} />}
      {questions.length > 0 && (
        <SimilarQuestionsList questions={questions} variant={variant} />
      )}
    </div>
  );
};

export default SimilarQuestions;
