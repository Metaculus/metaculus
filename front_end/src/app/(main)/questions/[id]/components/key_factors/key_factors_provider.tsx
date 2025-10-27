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

type KeyFactorsContextValue = {
  forceExpandedState?: boolean;
  requestExpand: () => void;
};

const KeyFactorsContext = createContext<KeyFactorsContextValue | undefined>(
  undefined
);

export const KeyFactorsProvider = ({ children }: PropsWithChildren) => {
  const hash = useHash();
  const [forceExpandedState, setForceExpandedState] = useState<boolean>();

  // Expand immediately if URL hash points to key factors
  useEffect(() => {
    if (hash === "key-factors") {
      setForceExpandedState(true);
    }
  }, [hash]);

  const requestExpand = useCallback(() => {
    setForceExpandedState(true);
  }, []);

  const value = useMemo(
    () => ({ forceExpandedState, requestExpand }),
    [forceExpandedState, requestExpand]
  );

  return (
    <KeyFactorsContext.Provider value={value}>
      {children}
    </KeyFactorsContext.Provider>
  );
};

export const useKeyFactorsContext = () => {
  const ctx = useContext(KeyFactorsContext);
  if (!ctx) {
    throw new Error(
      "useKeyFactorsContext must be used within KeyFactorsProvider"
    );
  }
  return ctx;
};
