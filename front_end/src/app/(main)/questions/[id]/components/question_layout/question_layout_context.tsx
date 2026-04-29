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
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { KeyFactor } from "@/types/comment";

type KeyFactorOverlayState =
  | { kind: "keyFactor"; keyFactor: KeyFactor }
  | { kind: "questionLink"; link: FetchedAggregateCoherenceLink }
  | null;

type QuestionLayoutContextValue = {
  // Key Factors Section UI State
  keyFactorsExpanded?: boolean;
  requestKeyFactorsExpand: () => void;

  // Key Factor Overlay
  keyFactorOverlay: KeyFactorOverlayState;
  openKeyFactorOverlay: (kf: KeyFactor) => void;
  openQuestionLinkOverlay: (link: FetchedAggregateCoherenceLink) => void;
  closeKeyFactorOverlay: () => void;

  // Comment reply trigger
  replyToCommentId: number | null;
  requestReplyToComment: (commentId: number) => void;
  clearReplyToComment: () => void;

  // Comment scroll trigger
  scrollToCommentId: number | null;
  requestScrollToComment: (commentId: number) => void;
  clearScrollToComment: () => void;

  // Active tab state (shared between mobile + desktop tab bars)
  activeTab?: string;
  setActiveTab: (tab: string) => void;
};

const TAB_HASH_VALUES = new Set([
  "comments",
  "timeline",
  "scores",
  "key-factors",
  "info",
  "question-links",
  "private-notes",
]);

const QuestionLayoutContext = createContext({} as QuestionLayoutContextValue);

export const QuestionLayoutProvider = ({ children }: PropsWithChildren) => {
  const hash = useHash();
  const [keyFactorsExpanded, setKeyFactorsExpanded] = useState<boolean>();
  const [activeTab, setActiveTab] = useState<string>();
  const [keyFactorOverlay, setKeyFactorOverlay] =
    useState<KeyFactorOverlayState>(null);

  useEffect(() => {
    if (!hash) return;
    if (hash === "key-factors") {
      setKeyFactorsExpanded(true);
    }
    if (TAB_HASH_VALUES.has(hash)) {
      setActiveTab(hash);
    }
  }, [hash]);

  const requestKeyFactorsExpand = useCallback(() => {
    setKeyFactorsExpanded(true);
    setActiveTab("key-factors");
  }, []);

  const openKeyFactorOverlay = useCallback((kf: KeyFactor) => {
    setKeyFactorOverlay({ kind: "keyFactor", keyFactor: kf });
  }, []);

  const openQuestionLinkOverlay = useCallback(
    (link: FetchedAggregateCoherenceLink) => {
      setKeyFactorOverlay({ kind: "questionLink", link });
    },
    []
  );

  const closeKeyFactorOverlay = useCallback(() => {
    setKeyFactorOverlay(null);
  }, []);

  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const requestReplyToComment = useCallback((commentId: number) => {
    setReplyToCommentId(commentId);
  }, []);
  const clearReplyToComment = useCallback(() => {
    setReplyToCommentId(null);
  }, []);

  const [scrollToCommentId, setScrollToCommentId] = useState<number | null>(
    null
  );
  const requestScrollToComment = useCallback((commentId: number) => {
    setScrollToCommentId(commentId);
  }, []);
  const clearScrollToComment = useCallback(() => {
    setScrollToCommentId(null);
  }, []);

  const value = useMemo<QuestionLayoutContextValue>(
    () => ({
      keyFactorsExpanded,
      requestKeyFactorsExpand,
      keyFactorOverlay,
      openKeyFactorOverlay,
      openQuestionLinkOverlay,
      closeKeyFactorOverlay,
      replyToCommentId,
      requestReplyToComment,
      clearReplyToComment,
      scrollToCommentId,
      requestScrollToComment,
      clearScrollToComment,
      activeTab,
      setActiveTab,
    }),
    [
      keyFactorsExpanded,
      requestKeyFactorsExpand,
      keyFactorOverlay,
      openKeyFactorOverlay,
      openQuestionLinkOverlay,
      closeKeyFactorOverlay,
      replyToCommentId,
      requestReplyToComment,
      clearReplyToComment,
      scrollToCommentId,
      requestScrollToComment,
      clearScrollToComment,
      activeTab,
    ]
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
