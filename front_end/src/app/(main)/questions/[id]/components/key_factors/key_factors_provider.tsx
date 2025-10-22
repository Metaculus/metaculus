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

import AddKeyFactorsModal from "@/app/(main)/questions/[id]/components/key_factors/add_key_factors_modal";
import { useAuth } from "@/contexts/auth_context";
import useHash from "@/hooks/use_hash";
import { PostWithForecasts } from "@/types/post";

type KeyFactorsContextValue = {
  forceExpandedState?: boolean;
  requestExpand: () => void;
  setIsAddModalOpen: (isOpen: boolean) => void;
  isAddModalOpen: boolean;
};

type KeyFactorsProviderProps = {
  post: PostWithForecasts;
};

const KeyFactorsContext = createContext<KeyFactorsContextValue | undefined>(
  undefined
);

export const KeyFactorsProvider = ({
  children,
  post,
}: PropsWithChildren<KeyFactorsProviderProps>) => {
  const hash = useHash();
  const [forceExpandedState, setForceExpandedState] = useState<boolean>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useAuth();

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
    () => ({
      forceExpandedState,
      requestExpand,
      isAddModalOpen,
      setIsAddModalOpen,
    }),
    [forceExpandedState, isAddModalOpen, requestExpand]
  );

  return (
    <KeyFactorsContext.Provider value={value}>
      {user && (
        <AddKeyFactorsModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          post={post}
          user={user}
        />
      )}

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
