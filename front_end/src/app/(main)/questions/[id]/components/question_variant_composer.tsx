"use client";

import { ReactNode } from "react";

import { useAuth } from "@/contexts/auth_context";
import { CurrentUser, InterfaceType } from "@/types/users";

type Variant = "forecaster" | "consumer";

export type QuestionVariantComposerProps = {
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
  consumer,
  forecaster,
}: QuestionVariantComposerProps) => {
  const { user } = useAuth();

  const forcedByUser = getVariantFromUser(user);
  if (forcedByUser) {
    return <>{forcedByUser === "consumer" ? consumer : forecaster}</>;
  }

  if (!user) {
    return <>{consumer}</>;
  }

  return <>{forecaster}</>;
};
