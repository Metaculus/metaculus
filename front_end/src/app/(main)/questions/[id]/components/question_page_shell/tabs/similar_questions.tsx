"use client";

import { useQuery } from "@tanstack/react-query";
import { FC } from "react";

import ClientPostsApi from "@/services/api/posts/posts.client";
import { PostStatus, PostWithForecasts } from "@/types/post";

import SimilarQuestionsList from "../../sidebar/similar_questions/similar_questions_list";

type Props = {
  post: PostWithForecasts;
  variant?: "forecaster" | "consumer";
};

const SimilarQuestionsTab: FC<Props> = ({ post, variant }) => {
  const isApproved = post.curation_status === PostStatus.APPROVED;

  const { data: similarQuestions = [], isSuccess: hasSimilarQuestionsResult } =
    useQuery({
      queryKey: ["similar-posts", post.id],
      queryFn: () => ClientPostsApi.getSimilarPosts(post.id),
      enabled: isApproved,
    });

  const { data: topQuestions = [] } = useQuery({
    queryKey: ["top-posts-fallback"],
    queryFn: () =>
      ClientPostsApi.getPostsWithCP({
        topic: "top-50",
        for_main_feed: "false",
        order_by: "-hotness",
        limit: 8,
      }),
    // only fetch when similar posts query settled with no results
    enabled:
      !isApproved || (hasSimilarQuestionsResult && !similarQuestions.length),
    select: (data) => data.results.filter((q) => q.id !== post.id),
  });

  const displayQuestions = similarQuestions.length
    ? similarQuestions
    : topQuestions;

  if (!displayQuestions.length) return null;

  return (
    <SimilarQuestionsList questions={displayQuestions} variant={variant} />
  );
};

export default SimilarQuestionsTab;
