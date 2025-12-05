"use client";

import { MDXEditorMethods } from "@mdxeditor/editor";
import { isNil } from "lodash";
import { useLocale, useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useRef, useState } from "react";

import { savePrivateNote } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import LoadingSpinner from "@/components/ui/loading_spiner";
import RelativeTime from "@/components/ui/relative_time";
import SectionToggle from "@/components/ui/section_toggle";
import { useDebouncedCallback } from "@/hooks/use_debounce";
import { Post } from "@/types/post";
import { formatDate } from "@/utils/formatters/date";

type Props = {
  post: Post;
};

const SavedAgo: FC<{
  savedAt: Date;
}> = ({ savedAt }) => {
  const [now, setNow] = useState(Date.now());
  const diff = now - savedAt.getTime();
  const t = useTranslations();
  const locale = useLocale();

  useEffect(() => {
    if (diff < 60_000) {
      // Schedule an update exactly when it crosses 60s
      const timeout = setTimeout(() => {
        setNow(Date.now());
      }, 60_000 - diff);

      return () => clearTimeout(timeout);
    }
  }, [diff]);

  if (diff < 60_000) {
    return t.rich("savedAgo", {
      date: () => "just now",
    });
  }

  return t.rich("savedAgo", {
    date: () => (
      <RelativeTime datetime={savedAt.toString()} format="relative">
        {formatDate(locale, savedAt)}
      </RelativeTime>
    ),
  });
};

const PrivateNote: FC<Props> = ({ post: { private_note, id } }) => {
  const t = useTranslations();
  const locale = useLocale();
  const { text, updated_at } = private_note || {};
  const [noteText, setNoteText] = useState(text || "");
  const [isLoading, setIsLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<undefined | Date>();
  const editorRef = useRef<MDXEditorMethods>(null);

  const noteStatusDetails = useMemo(() => {
    if (isLoading) {
      return <LoadingSpinner size="1x" />;
    }

    if (savedAt) {
      return <SavedAgo savedAt={savedAt} />;
    }
  }, [savedAt, isLoading]);

  const saveNote = async (value: string) => {
    if (value === noteText) {
      return;
    }

    setNoteText(value);

    setIsLoading(true);
    await savePrivateNote(id, value);
    setIsLoading(false);

    setSavedAt(new Date());
  };

  const saveNoteDebounced = useDebouncedCallback(saveNote, 1500);

  return (
    <SectionToggle
      title={t("privateNote")}
      variant={text ? "orange" : "primary"}
      detailElement={(isOpen) => {
        if (isOpen) {
          return <div className="ml-auto text-xs">{noteStatusDetails}</div>;
        } else if (updated_at) {
          return (
            <div className="ml-auto text-xs">
              {t.rich("privateNoteUpdatedFrom", {
                date: () => (
                  <RelativeTime datetime={updated_at} format="relative">
                    {formatDate(locale, new Date(updated_at))}
                  </RelativeTime>
                ),
              })}
            </div>
          );
        }
      }}
    >
      <div className="bg-gray-0 dark:bg-gray-0-dark">
        <MarkdownEditor
          ref={editorRef}
          markdown={noteText}
          mode="write"
          onChange={(val) => {
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
      </div>
    </SectionToggle>
  );
};

export default PrivateNote;
