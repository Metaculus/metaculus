"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { deleteKeyFactor as deleteKeyFactorAction } from "@/app/(main)/questions/actions";
import { useModal } from "@/contexts/modal_context";
import useHash from "@/hooks/use_hash";

type KeyFactorsContextValue = {
  forceExpandedState?: boolean;
  requestExpand: () => void;
  openDeleteModal: (id: number) => void;
};

const KeyFactorsContext = createContext<KeyFactorsContextValue | undefined>(
  undefined
);

export const KeyFactorsProvider = ({ children }: PropsWithChildren) => {
  const hash = useHash();
  const t = useTranslations();
  const [forceExpandedState, setForceExpandedState] = useState<boolean>();
  const { setCurrentModal } = useModal();
  // TODO: refactor hooks and structure.
  //    Move all KeyFactor related hooks out of useCommentsFeed
  const { combinedKeyFactors, setCombinedKeyFactors } = useCommentsFeed();

  // Expand immediately if URL hash points to key factors
  useEffect(() => {
    if (hash === "key-factors") {
      setForceExpandedState(true);
    }
  }, [hash]);

  const requestExpand = useCallback(() => {
    setForceExpandedState(true);
  }, []);

  const openDeleteModal = useCallback(
    async (keyFactorId: number) => {
      setCurrentModal({
        type: "confirm",
        data: {
          title: t("confirmDeletion"),
          description: t("confirmDeletionKeyFactorDescription"),
          onConfirm: async () => {
            const result = await deleteKeyFactorAction(keyFactorId);

            if (!result || !("errors" in result)) {
              setCombinedKeyFactors(
                combinedKeyFactors.filter((kf) => kf.id !== keyFactorId)
              );
            }
          },
        },
      });
    },
    [setCurrentModal, t, combinedKeyFactors, setCombinedKeyFactors]
  );

  const value = useMemo(
    () => ({ forceExpandedState, requestExpand, openDeleteModal }),
    [forceExpandedState, openDeleteModal, requestExpand]
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
