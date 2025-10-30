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

  // Mobile tab state
  mobileActiveTab?: string;
  setMobileActiveTab: (tab: string) => void;
};

const QuestionLayoutContext = createContext({} as QuestionLayoutContextValue);

export const QuestionLayoutProvider = ({ children }: PropsWithChildren) => {
  const hash = useHash();
  const [keyFactorsExpanded, setKeyFactorsExpanded] = useState<boolean>();
  const [mobileActiveTab, setMobileActiveTab] = useState<string>();

  // Expand key factors section if URL hash points to it
  useEffect(() => {
    if (hash === "key-factors") {
      setKeyFactorsExpanded(true);
      setMobileActiveTab("key-factors");
    }
  }, [hash]);

  const requestKeyFactorsExpand = useCallback(() => {
    setKeyFactorsExpanded(true);
    setMobileActiveTab("key-factors");
  }, []);

  const value = useMemo<QuestionLayoutContextValue>(
    () => ({
      keyFactorsExpanded,
      requestKeyFactorsExpand,
      mobileActiveTab,
      setMobileActiveTab,
    }),
    [keyFactorsExpanded, requestKeyFactorsExpand, mobileActiveTab]
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
