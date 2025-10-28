"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import useHash from "@/hooks/use_hash";

type QuestionLayoutContextValue = {
  // Key Factors Section UI State
  keyFactorsExpanded?: boolean;
  requestKeyFactorsExpand: () => void;
};

const QuestionLayoutContext = createContext<
  QuestionLayoutContextValue | undefined
>(undefined);

export const QuestionLayoutProvider = ({ children }: PropsWithChildren) => {
  const hash = useHash();
  const [keyFactorsExpanded, setKeyFactorsExpanded] = useState<boolean>();

  // Expand key factors section if URL hash points to it
  useEffect(() => {
    if (hash === "key-factors") {
      setKeyFactorsExpanded(true);
    }
  }, [hash]);

  const requestKeyFactorsExpand = useCallback(() => {
    setKeyFactorsExpanded(true);
  }, []);

  const value = useMemo<QuestionLayoutContextValue>(
    () => ({
      keyFactorsExpanded,
      requestKeyFactorsExpand,
    }),
    [keyFactorsExpanded, requestKeyFactorsExpand]
  );

  return (
    <QuestionLayoutContext.Provider value={value}>
      {children}
    </QuestionLayoutContext.Provider>
  );
};

export const useQuestionLayout = () => {
  const ctx = useContext(QuestionLayoutContext);
  if (!ctx) {
    throw new Error(
      "useQuestionLayout must be used within QuestionLayoutProvider"
    );
  }
  return ctx;
};

/**
 * Safe version that returns null instead of throwing if provider isn't available.
 * Use in components that might render outside of QuestionLayout (e.g., prediction flow).
 */
export const useQuestionLayoutSafe = () => {
  return useContext(QuestionLayoutContext);
};
