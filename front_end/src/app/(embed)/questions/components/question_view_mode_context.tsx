"use client";

import React, { createContext, useContext } from "react";

export type QuestionViewMode = "default" | "embed";

type QuestionViewContextValue = {
  mode: QuestionViewMode;
  containerWidth?: number;
};

const QuestionViewModeContext = createContext<QuestionViewContextValue>({
  mode: "default",
  containerWidth: undefined,
});

type ProviderProps = {
  mode?: QuestionViewMode;
  containerWidth?: number;
  children: React.ReactNode;
};

export const QuestionViewModeProvider: React.FC<ProviderProps> = ({
  mode = "default",
  containerWidth,
  children,
}) => (
  <QuestionViewModeContext.Provider value={{ mode, containerWidth }}>
    {children}
  </QuestionViewModeContext.Provider>
);

export const useQuestionViewMode = () =>
  useContext(QuestionViewModeContext).mode;

export const useIsEmbedMode = () => useQuestionViewMode() === "embed";

export const useEmbedContainerWidth = () =>
  useContext(QuestionViewModeContext).containerWidth;

export const useIsEmbedNarrow = (maxWidthPx: number) => {
  const isEmbed = useIsEmbedMode();
  const w = useEmbedContainerWidth();
  return !!isEmbed && typeof w === "number" && w > 0 && w < maxWidthPx;
};
