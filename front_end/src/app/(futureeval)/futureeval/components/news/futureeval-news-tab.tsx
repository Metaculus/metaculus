import React, { Suspense } from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { POSTS_PER_PAGE } from "@/constants/posts_feed";
import ServerPostsApi from "@/services/api/posts/posts.server";

import FutureEvalNewsFeed from "./futureeval-news-feed";

/**
 * FutureEval News Tab
 *
 * A themed variant of the AIBNewsTab for the FutureEval project.
 * Uses FutureEval-specific news cards and styling.
 */
const FutureEvalNewsTab: React.FC = async () => {
  const filters = {
    tournaments: "futureeval-posts",
  };

  const { results: questions } = await ServerPostsApi.getPostsWithCP({
    ...filters,
    limit: POSTS_PER_PAGE,
  });

  return (
    <div className="w-full">
      <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
        <Suspense
          fallback={
            <LoadingIndicator className="mx-auto h-8 w-24 text-futureeval-primary-light dark:text-futureeval-primary-dark" />
          }
        >
          <FutureEvalNewsFeed filters={filters} initialQuestions={questions} />
        </Suspense>
      </div>
    </div>
  );
};

export default WithServerComponentErrorBoundary(FutureEvalNewsTab);
