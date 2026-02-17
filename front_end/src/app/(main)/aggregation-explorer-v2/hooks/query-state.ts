"use client";

import { parseAsInteger, useQueryStates } from "nuqs";

export function useAggregationExplorerQueryState() {
  const [searchParams, setSearchParams] = useQueryStates({
    post_id: parseAsInteger,
    question_id: parseAsInteger,
  });

  const setSelection = (postId: number, questionId: number | null) =>
    setSearchParams(
      {
        post_id: postId,
        question_id: questionId,
      },
      { history: "push" }
    );

  return {
    postId: searchParams.post_id,
    questionId: searchParams.question_id,
    setSelection,
  };
}
