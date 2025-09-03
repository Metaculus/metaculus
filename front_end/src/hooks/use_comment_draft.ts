"use client";

import { isNil } from "lodash";
import { useEffect, useRef, useState } from "react";

import { useDebouncedCallback } from "@/hooks/use_debounce";
import {
  cleanupCommentDrafts,
  getCommentDraft,
  saveCommentDraft,
} from "@/utils/drafts/comments";

type Args = {
  text?: string;
  postId?: number;
  parentId?: number;
  userId?: number;
};

type Return = {
  draftReady: boolean;
  initialMarkdown: string;
  setInitialMarkdown: (v: string) => void;
  markdownRef: React.MutableRefObject<string>;
  hasIncludedForecast: boolean;
  setHasIncludedForecast: (v: boolean) => void;
  hasContent: boolean;
  setHasContent: (v: boolean) => void;
  saveDraftDebounced: (value: string) => void;
};

export function useCommentDraft({
  text,
  postId,
  parentId,
  userId,
}: Args): Return {
  const [draftReady, setDraftReady] = useState(false);
  const [initialMarkdown, setInitialMarkdown] = useState<string>(text ?? "");
  const markdownRef = useRef<string>(text ?? "");
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const [hasContent, setHasContent] = useState(
    () => (text ?? "").trim().length > 0
  );

  // Load comment draft and remove old ones on mount
  useEffect(() => {
    let cancelled = false;

    const loadDraft = () => {
      if (postId && userId) {
        cleanupCommentDrafts();
        const draft = getCommentDraft(userId, postId, parentId);
        const md = draft?.markdown ?? text ?? "";
        if (!cancelled) {
          markdownRef.current = md;
          setInitialMarkdown(md);
          setHasIncludedForecast(draft?.includeForecast ?? false);
          setHasContent(md.trim().length > 0);
          setDraftReady(true);
        }
      } else {
        const md = text ?? "";
        markdownRef.current = md;
        setInitialMarkdown(md);
        setHasContent(md.trim().length > 0);
        setDraftReady(true);
      }
    };

    loadDraft();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, parentId, userId, text]);

  const saveDraftDebounced = useDebouncedCallback((value: string) => {
    if (!draftReady) return;
    if (!isNil(postId) && userId) {
      saveCommentDraft({
        markdown: value,
        includeForecast: hasIncludedForecast,
        lastModified: Date.now(),
        userId,
        postId,
        parentId,
      });
    }
  }, 1000);

  useEffect(() => {
    if (!draftReady) return;
    if (!isNil(postId) && userId) {
      saveCommentDraft({
        markdown: markdownRef.current ?? "",
        includeForecast: hasIncludedForecast,
        lastModified: Date.now(),
        userId,
        postId,
        parentId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIncludedForecast, draftReady]);

  return {
    draftReady,
    initialMarkdown,
    setInitialMarkdown,
    markdownRef,
    hasIncludedForecast,
    setHasIncludedForecast,
    hasContent,
    setHasContent,
    saveDraftDebounced,
  };
}
