"use client";

import { isNil } from "lodash";
import { ReactNode } from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import { isConditionalPost, isNotebookPost } from "@/utils/questions/helpers";

type Variant = "forecaster" | "consumer";

export type QuestionVariantComposerProps = {
  postData: PostWithForecasts;
  consumer: ReactNode;
  forecaster: ReactNode;
};

function getVariant(post: PostWithForecasts, user: unknown): Variant {
  return isNil(user) && !isNotebookPost(post) && !isConditionalPost(post)
    ? "consumer"
    : "forecaster";
}

export const QuestionVariantComposer = ({
  postData,
  consumer,
  forecaster,
}: QuestionVariantComposerProps) => {
  const { user } = useAuth();
  const variant = getVariant(postData, user);

  return <>{variant === "consumer" ? consumer : forecaster}</>;
};
