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
  const { data: questions = [], isFetching } = useQuery({
    queryKey: ["similar-posts", post.id],
    queryFn: () => ClientPostsApi.getSimilarPosts(post.id),
    enabled: post.curation_status === PostStatus.APPROVED,
  });

  if (isFetching || !questions.length) return null;

  return <SimilarQuestionsList questions={questions} variant={variant} />;
};

export default SimilarQuestionsTab;
