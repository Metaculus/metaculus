"use client";

import { FormEvent, useState } from "react";

import { parseQuestionId } from "@/utils/questions/helpers";

import AggregationExplorerLoadedView from "./components/aggregation_explorer_loaded_view";
import SearchForm from "./components/search_form";
import { usePostData } from "./hooks/post-data";
import { useAggregationExplorerQueryState } from "./hooks/query-state";

export default function AggregationExplorerV2Page() {
  const { postId, setSelection, querySource } =
    useAggregationExplorerQueryState();
  const [queryInput, setQueryInput] = useState(postId?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const {
    data: postData,
    isPending: isPostDataPending,
    isError: isPostDataError,
    error: postDataError,
  } = usePostData(postId);

  if (postData) {
    return <AggregationExplorerLoadedView postData={postData} />;
  }

  const handleExplore = (e: FormEvent) => {
    e.preventDefault();
    const input = queryInput.trim();

    if (!input) {
      setError("Please enter a question URL or ID.");
      return;
    }

    const numericValue = Number(input);
    let postId: number | null = null;
    let questionId: number | null = null;

    if (!isNaN(numericValue)) {
      postId = numericValue;
    } else {
      const parsed = parseQuestionId(input);
      postId = parsed.postId;
      questionId = parsed.questionId;
    }

    if (postId === null) {
      setError("Could not parse a valid question from the input.");
      return;
    }

    setError(null);
    void setSelection(postId, questionId, { fromForm: true });
  };

  const fromUrl = querySource === "url";

  return (
    <main className="mx-auto flex min-h-[calc(90vh-120px)] w-full items-center px-4 lg:px-20">
      <section className="mx-auto w-full max-w-[1352px] p-6 sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-balance text-3xl font-semibold text-blue-900 dark:text-blue-900-dark sm:text-4xl">
            Aggregation Explorer
          </h1>
          {!fromUrl && (
            <>
              <p className="mx-auto mt-3 max-w-xl text-sm text-gray-700 dark:text-gray-700-dark sm:text-base">
                Paste a Metaculus question URL or enter an ID to begin.
              </p>

              <SearchForm
                value={queryInput}
                error={error}
                disabled={postId !== null && isPostDataPending}
                onSubmit={handleExplore}
                onChange={(value) => {
                  setQueryInput(value);
                  if (error) {
                    setError(null);
                  }
                }}
              />
            </>
          )}
          <div className="mt-4 min-h-6">
            {postId !== null && isPostDataPending && (
              <p className="text-sm text-gray-700 dark:text-gray-700-dark">
                Loading question data...
              </p>
            )}
            {postId !== null && isPostDataError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                Failed to load question data: {postDataError.message}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
