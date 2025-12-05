"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC, useMemo, useState, useEffect } from "react";

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

  const noteStatusDetails = useMemo(() => {
    if (isLoading) {
      return <LoadingSpinner size="1x" />;
    }

    if (savedAt) {
      return <SavedAgo savedAt={savedAt} />;
    }

    if (updated_at) {
      return t.rich("privateNoteUpdatedFrom", {
        date: () => (
          <RelativeTime datetime={updated_at} format="relative">
            {formatDate(locale, new Date(updated_at))}
          </RelativeTime>
        ),
      });
    }
  }, [savedAt, isLoading, locale, t, updated_at]);

  const saveNoteDebounced = useDebouncedCallback(async (value: string) => {
    if (value === noteText) {
      return;
    }

    setIsLoading(true);
    await savePrivateNote(id, value);
    setIsLoading(false);

    setSavedAt(new Date());
  }, 1000);

  return (
    <SectionToggle
      title={t("privateNote")}
      variant="orange"
      detailElement={() => (
        <div className="ml-auto text-xs">{noteStatusDetails}</div>
      )}
    >
      <div className="bg-gray-0 dark:bg-gray-0-dark">
        <MarkdownEditor
          markdown={noteText}
          mode="write"
          onChange={(val) => {
            saveNoteDebounced(val);
          }}
          withUgcLinks
          withCodeBlocks
        />
      </div>
    </SectionToggle>
  );
};

export default PrivateNote;
