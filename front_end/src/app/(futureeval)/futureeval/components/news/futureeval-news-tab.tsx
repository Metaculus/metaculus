import React from "react";

import WithServerComponentErrorBoundary from "@/components/server_component_error_boundary";
import { POST_PAGE_FILTER, POSTS_PER_PAGE } from "@/constants/posts_feed";
import ServerPostsApi from "@/services/api/posts/posts.server";
import { SearchParams } from "@/types/navigation";

import FutureEvalNewsFeed from "./futureeval-news-feed";

/**
 * FutureEval News Tab
 *
 * A themed variant of the AIBNewsTab for the FutureEval project.
 * Uses FutureEval-specific news cards and styling.
 */
type Props = {
  searchParams?: SearchParams;
};

function getHydrationPageNumber(searchParams: SearchParams) {
  const rawPageNumber = searchParams[POST_PAGE_FILTER];
  const pageNumber =
    typeof rawPageNumber === "string" ? Number(rawPageNumber) : 1;

  return Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
}

const FutureEvalNewsTab: React.FC<Props> = async ({ searchParams = {} }) => {
  const pageNumber = getHydrationPageNumber(searchParams);
  const filters = {
    tournaments: "futureeval-posts",
    page: pageNumber,
  };

  const { results: questions } = await ServerPostsApi.getPostsWithCP({
    ...filters,
    limit: pageNumber * POSTS_PER_PAGE,
  });

  return (
    <div className="w-full">
      <div className="min-h-[calc(100vh-300px)] grow overflow-x-hidden p-2 pt-2.5 no-scrollbar sm:p-0 sm:pt-5">
        <FutureEvalNewsFeed filters={filters} initialQuestions={questions} />
      </div>
    </div>
  );
};

export default WithServerComponentErrorBoundary(FutureEvalNewsTab);
