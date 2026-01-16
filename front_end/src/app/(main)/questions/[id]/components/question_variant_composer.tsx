"use client";

import { isNil } from "lodash";
import { useFeatureFlagVariantKey } from "posthog-js/react";
import { ReactNode } from "react";

import { useAuth } from "@/contexts/auth_context";
import { PostWithForecasts } from "@/types/post";
import { CurrentUser, InterfaceType } from "@/types/users";
import { isConditionalPost, isNotebookPost } from "@/utils/questions/helpers";

type Variant = "forecaster" | "consumer";
const FLAG_KEY = "logged_out_question_view_variant";

export type QuestionVariantComposerProps = {
  postData: PostWithForecasts;
  consumer: ReactNode;
  forecaster: ReactNode;
};

function getVariantFromUser(user: CurrentUser | null): Variant | null {
  if (user?.interface_type === InterfaceType.ConsumerView) return "consumer";
  if (user?.interface_type === InterfaceType.ForecasterView)
    return "forecaster";
  return null;
}

export const QuestionVariantComposer = ({
  postData,
  consumer,
  forecaster,
}: QuestionVariantComposerProps) => {
  const { user } = useAuth();
  const flagVariant = useFeatureFlagVariantKey(FLAG_KEY);

  const forcedByUser = getVariantFromUser(user);
  if (forcedByUser) {
    return <>{forcedByUser === "consumer" ? consumer : forecaster}</>;
  }

  const isEligibleLoggedOut =
    isNil(user) && !isNotebookPost(postData) && !isConditionalPost(postData);

  if (isEligibleLoggedOut) {
    const v = flagVariant === "forecaster" ? "forecaster" : "consumer";
    return <>{v === "consumer" ? consumer : forecaster}</>;
  }

  return <>{forecaster}</>;
};
