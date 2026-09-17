"use client";

import { MDXEditorMethods } from "@mdxeditor/editor";
import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import { useQuestionLayoutSafe } from "@/app/(main)/questions/[id]/components/question_layout/question_layout_context";
import { savePrivateNote } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import LoadingSpinner from "@/components/ui/loading_spiner";
import RelativeTime from "@/components/ui/relative_time";
import SectionToggle from "@/components/ui/section_toggle";
import { useAuth } from "@/contexts/auth_context";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import { Post } from "@/types/post";
import { logError } from "@/utils/core/errors";
import { formatDate } from "@/utils/formatters/date";

type Props = {
  post: Post;
  hideToggle?: boolean;
};

const SavedAgo: FC<{ savedAt: Date }> = ({ savedAt }) => {
  const t = useTranslations();
  const locale = useLocale();

  const savedAtMs = savedAt.getTime();
  const [isJustNow, setIsJustNow] = useState(
    () => Date.now() - savedAtMs < 60_000
  );

  useEffect(() => {
    const elapsed = Date.now() - savedAtMs;
    const remaining = 60_000 - elapsed;

    if (remaining <= 0) {
      setIsJustNow(false);
      return;
    }

    setIsJustNow(true);
    const id = window.setTimeout(() => setIsJustNow(false), remaining);
    return () => window.clearTimeout(id);
  }, [savedAtMs]);

  return t.rich("savedAgo", {
    date: () =>
      isJustNow ? (
        t("justNow")
      ) : (
        <RelativeTime datetime={savedAt.toISOString()} format="relative">
          {formatDate(locale, savedAt)}
        </RelativeTime>
      ),
  });
};

const PrivateNote: FC<Props> = ({ post: { private_note, id }, hideToggle }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { text, updated_at } = private_note || {};
  const questionLayout = useQuestionLayoutSafe();
  // Seed from context first so the note survives Private Notes tab-panel remounts
  // (context persists the latest edit; the `post` prop stays at its page-load value).
  const [noteText, setNoteText] = useState(
    () => questionLayout?.privateNoteText ?? text ?? ""
  );
  const [isLoading, setIsLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<undefined | Date>();
  const { user } = useAuth();
  const editorRef = useRef<MDXEditorMethods>(null);
  const latestValueRef = useRef(noteText);
  // Value of the most recent save request, kept apart from the displayed text so
  // that mirroring edits eagerly doesn't make the editor look already-saved.
  // null after a failed request, so retrying the same text isn't deduped away.
  const lastRequestedRef = useRef<string | null>(noteText);
  const saveRequestIdRef = useRef(0);

  const noteStatusDetails = useMemo(() => {
    if (isLoading) {
      return <LoadingSpinner size="1x" />;
    }

    if (savedAt) {
      return <SavedAgo savedAt={savedAt} />;
    }
  }, [savedAt, isLoading]);

  // Publish every edit right away: the debounce and the request that follow can
  // outlive this component (switching tabs unmounts the panel), and the context
  // is what the next mount reads from.
  const syncValue = (value: string) => {
    latestValueRef.current = value;
    setNoteText(value);
    questionLayout?.setPrivateNoteText(value);
  };

  const saveNote = async (value: string) => {
    syncValue(value);

    if (value === lastRequestedRef.current) {
      return;
    }
    lastRequestedRef.current = value;

    const requestId = ++saveRequestIdRef.current;
    setIsLoading(true);

    try {
      await savePrivateNote(id, value);
    } catch (error) {
      logError(error);

      // Nothing reached the server, so let an identical retry through — unless a
      // newer request has already claimed the ref.
      if (lastRequestedRef.current === value) {
        lastRequestedRef.current = null;
      }
      return;
    } finally {
      if (requestId === saveRequestIdRef.current) {
        setIsLoading(false);
      }
    }

    if (requestId !== saveRequestIdRef.current) {
      // Superseded while in flight — the newest request reports the final status.
      return;
    }

    setSavedAt(new Date());
  };

  const saveNoteDebounced = useDebouncedCallback(saveNote, 1500);

  // The debounce timer is dropped on unmount, so hand off anything still pending.
  useEffect(() => {
    return () => {
      if (latestValueRef.current !== lastRequestedRef.current) {
        savePrivateNote(id, latestValueRef.current).catch(logError);
      }
    };
  }, [id]);

  const hasNoteContent = noteText.trim().length > 0;

  if (!user) {
    return null;
  }

  const editorBody = (
    <MarkdownEditor
      ref={editorRef}
      markdown={noteText}
      mode="write"
      onChange={(val) => {
        syncValue(val);
        saveNoteDebounced(val);
      }}
      onBlur={() => {
        const val = editorRef.current?.getMarkdown();
        if (!isNil(val)) {
          saveNote(val);
        }
      }}
      withUgcLinks
      withCodeBlocks
    />
  );

  const editor = (
    <div className="bg-gray-0 dark:bg-gray-0-dark">{editorBody}</div>
  );

  if (hideToggle) {
    return (
      <div className="flex flex-col gap-2">
        <div className="scroll-mt-24 border border-gray-500 bg-gray-0 dark:border-gray-500-dark dark:bg-gray-0-dark">
          {editorBody}
        </div>
        <div className="text-right text-xs">
          {noteStatusDetails ??
            (updated_at
              ? t.rich("privateNoteUpdatedFrom", {
                  date: () => (
                    <RelativeTime datetime={updated_at} format="relative">
                      {formatDate(locale, new Date(updated_at))}
                    </RelativeTime>
                  ),
                })
              : t("privateNoteAutosaveHint"))}
        </div>
      </div>
    );
  }

  return (
    <SectionToggle
      title={t("privateNote")}
      variant={text ? "orange" : "primary"}
      titleSuffix={
        hasNoteContent ? (
          <span className="size-2.5 shrink-0 rounded-full bg-orange-500 dark:bg-orange-500-dark" />
        ) : null
      }
      detailElement={(isOpen) => (
        <div className="ml-auto text-xs">
          {(isOpen ? noteStatusDetails : undefined) ??
            (updated_at
              ? t.rich("privateNoteUpdatedFrom", {
                  date: () => (
                    <RelativeTime datetime={updated_at} format="relative">
                      {formatDate(locale, new Date(updated_at))}
                    </RelativeTime>
                  ),
                })
              : t("privateNoteAutosaveHint"))}
        </div>
      )}
    >
      {editor}
    </SectionToggle>
  );
};

export default PrivateNote;
