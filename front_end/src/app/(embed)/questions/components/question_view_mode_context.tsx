"use client";

import React, { createContext, useContext } from "react";

export type QuestionViewMode = "default" | "embed";

const QuestionViewModeContext = createContext<QuestionViewMode>("default");

type ProviderProps = {
  mode?: QuestionViewMode;
  children: React.ReactNode;
};

export const QuestionViewModeProvider: React.FC<ProviderProps> = ({
  mode = "default",
  children,
}) => (
  <QuestionViewModeContext.Provider value={mode}>
    {children}
  </QuestionViewModeContext.Provider>
);

export const useQuestionViewMode = () => useContext(QuestionViewModeContext);

export const useIsEmbedMode = () =>
  useContext(QuestionViewModeContext) === "embed";
