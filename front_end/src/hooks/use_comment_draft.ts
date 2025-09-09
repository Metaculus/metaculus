"use client";

import { isNil } from "lodash";
import { useEffect, useRef, useState } from "react";

import { useDebouncedCallback } from "@/hooks/use_debounce";
import {
  cleanupCommentDrafts,
  getCommentDraft,
  saveCommentDraft,
  deleteCommentDraft,
  cleanupCommentEditDrafts,
  getCommentEditDraft,
  saveCommentEditDraft,
  deleteCommentEditDraft,
} from "@/utils/drafts/comments";

type Args = {
  text?: string;
  postId?: number;
  parentId?: number;
  userId?: number;
  commentId?: number;
  onPostId?: number;
  isPrivate?: boolean;
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
  deleteDraft: () => void;
  stopAndDiscardDraft: () => void;
  kind: "create" | "edit";
};

export function useCommentDraft({
  text,
  userId,
  postId,
  parentId,
  commentId,
  onPostId,
  isPrivate,
}: Args): Return {
  const isEdit = !!commentId;
  const kind: "create" | "edit" = isEdit ? "edit" : "create";
  const [draftReady, setDraftReady] = useState(false);
  const [initialMarkdown, setInitialMarkdown] = useState<string>(text ?? "");
  const markdownRef = useRef<string>(text ?? "");
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const savingEnabledRef = useRef(true);
  const [hasContent, setHasContent] = useState(
    () => (text ?? "").trim().length > 0
  );

  // Load comment draft and remove old ones on mount
  useEffect(() => {
    let cancelled = false;

    const loadDraft = () => {
      if (!userId) {
        const md = text ?? "";
        markdownRef.current = md;
        setInitialMarkdown(md);
        setHasContent(md.trim().length > 0);
        setDraftReady(true);
        return;
      }

      if (isEdit) {
        if (!commentId) return;
        cleanupCommentEditDrafts();

        const d = getCommentEditDraft(userId, commentId);
        const md = d?.markdown ?? text ?? "";

        if (!cancelled) {
          markdownRef.current = md;
          setInitialMarkdown(md);
          setHasContent(md.trim().length > 0);
          setDraftReady(true);
        }
      } else {
        if (!postId) {
          const md = text ?? "";
          markdownRef.current = md;
          setInitialMarkdown(md);
          setHasContent(md.trim().length > 0);
          setDraftReady(true);
          return;
        }

        cleanupCommentDrafts();

        const d = getCommentDraft(userId, postId, parentId);
        const md = d?.markdown ?? text ?? "";

        if (!cancelled) {
          markdownRef.current = md;
          setInitialMarkdown(md);
          setHasIncludedForecast(d?.includeForecast ?? false);
          setHasContent(md.trim().length > 0);
          setDraftReady(true);
        }
      }
    };

    loadDraft();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, postId, parentId, commentId, text, isEdit]);

  const saveDraftDebounced = useDebouncedCallback((value: string) => {
    if (!draftReady || !userId || !savingEnabledRef.current) return;

    if (isEdit) {
      if (!commentId) return;
      saveCommentEditDraft({
        markdown: value,
        lastModified: Date.now(),
        userId,
        commentId,
        onPostId: onPostId ?? postId,
        isPrivate,
        kind: "edit",
      });
    } else {
      if (isNil(postId)) return;
      saveCommentDraft({
        markdown: value,
        includeForecast: hasIncludedForecast,
        lastModified: Date.now(),
        userId,
        postId,
        parentId,
        kind: "create",
      });
    }
  }, 1000);

  const stopAndDiscardDraft = () => {
    savingEnabledRef.current = false;
    deleteDraft();
    markdownRef.current = "";
    setInitialMarkdown("");
    setHasContent(false);
  };

  useEffect(() => {
    if (!draftReady || isEdit) return;
    if (!isNil(postId) && userId) {
      saveCommentDraft({
        markdown: markdownRef.current ?? "",
        includeForecast: hasIncludedForecast,
        lastModified: Date.now(),
        userId,
        postId,
        parentId,
        kind: "create",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIncludedForecast, draftReady, isEdit, postId, parentId, userId]);

  const deleteDraft = () => {
    if (!userId) return;
    if (isEdit && commentId) {
      deleteCommentEditDraft({ userId, commentId });
    } else if (!isNil(postId)) {
      deleteCommentDraft({ userId, postId, parentId });
    }
  };

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
    deleteDraft,
    kind,
    stopAndDiscardDraft,
  };
}
