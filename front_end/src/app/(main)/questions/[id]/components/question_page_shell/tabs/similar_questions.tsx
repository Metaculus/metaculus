"use client";

import { useQuery } from "@tanstack/react-query";
import { FC } from "react";

import LoadingSpinner from "@/components/ui/loading_spiner";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostStatus, PostWithForecasts } from "@/types/post";

import SimilarQuestionsList from "../../sidebar/similar_questions/similar_questions_list";

type Props = {
  post: PostWithForecasts;
  variant?: "forecaster" | "consumer";
};

const SimilarQuestionsTab: FC<Props> = ({ post, variant }) => {
  const isApproved = post.curation_status === PostStatus.APPROVED;

  const {
    data: similarQuestions = [],
    isSuccess: hasSimilarQuestionsResult,
    isError: isSimilarError,
    isLoading: isSimilarLoading,
  } = useQuery({
    queryKey: ["similar-posts", post.id],
    queryFn: () => ClientPostsApi.getSimilarPosts(post.id),
    enabled: isApproved,
  });

  const { data: topQuestions = [], isLoading: isTopLoading } = useQuery({
    queryKey: ["top-posts-fallback", variant],
    queryFn: () =>
      ClientPostsApi.getPostsWithCP({
        topic: "top-50",
        for_main_feed: "false",
        for_consumer_view: variant === "consumer" ? "true" : "false",
        order_by: "-hotness",
        statuses: [
          PostStatus.OPEN,
          PostStatus.CLOSED,
          PostStatus.RESOLVED,
          PostStatus.UPCOMING,
        ],
        limit: 8,
      }),
    // only fetch when similar posts query settled with no results or errored
    enabled:
      !isApproved ||
      isSimilarError ||
      (hasSimilarQuestionsResult && !similarQuestions.length),
    select: (data) => data.results.filter((q) => q.id !== post.id),
    staleTime: 5 * 60 * 1000,
  });

  const displayQuestions = similarQuestions.length
    ? similarQuestions
    : topQuestions;

  if (!displayQuestions.length) {
    if (isSimilarLoading || isTopLoading) {
      return <LoadingSpinner className="my-4" />;
    }
    return null;
  }

  return (
    <SimilarQuestionsList questions={displayQuestions} variant={variant} />
  );
};

export default SimilarQuestionsTab;
