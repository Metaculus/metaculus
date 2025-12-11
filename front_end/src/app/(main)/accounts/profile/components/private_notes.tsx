"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FC, useEffect, useState } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import RelativeTime from "@/components/ui/relative_time";
import ClientPostsApi from "@/services/api/posts/posts.client";
import { PrivateNoteWithPost } from "@/services/api/posts/posts.shared";
import { formatDate } from "@/utils/formatters/date";
import { getPostLink } from "@/utils/navigation";

const PrivateNoteCard: FC<{ note: PrivateNoteWithPost }> = ({ note }) => {
  const { post, text, updated_at } = note;
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-300 bg-white p-4 dark:border-gray-300-dark dark:bg-gray-0-dark">
      <h3 className="mb-2 mt-0 text-lg font-semibold">
        <Link
          href={getPostLink(post)}
          className="text-blue-700 no-underline hover:text-blue-800 dark:text-blue-600-dark hover:dark:text-blue-300"
        >
          {post.title}
        </Link>
      </h3>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <RelativeTime datetime={updated_at} format="relative">
          {formatDate(locale, new Date(updated_at))}
        </RelativeTime>
      </div>
      <div>
        <MarkdownEditor markdown={text} mode="read" withUgcLinks />
      </div>
    </div>
  );
};

const PrivateNotes: FC = () => {
  const t = useTranslations();
  const [notes, setNotes] = useState<PrivateNoteWithPost[]>([]);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = async (currentOffset: number) => {
    setIsLoading(true);
    try {
      const response = await ClientPostsApi.getPrivateNotes({
        limit: 10,
        offset: currentOffset,
      });
      setNotes((prev) => [
        ...(currentOffset > 0 ? prev : []),
        ...response.results,
      ]);
      setTotalCount(response.count);
      setOffset(currentOffset + 10);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchNotes(0);
  }, []);

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      {notes.map((note, index) => (
        <PrivateNoteCard key={`${note.post.id}-${index}`} note={note} />
      ))}
      {isLoading && <LoadingIndicator className="mx-auto my-4" />}
      {!isLoading && totalCount !== null && notes.length < totalCount && (
        <Button
          variant="secondary"
          onClick={() => fetchNotes(offset)}
          className="self-center"
        >
          {t("loadMore")}
        </Button>
      )}
      {!isLoading && notes.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400">
          {t("noPrivateNotes")}
        </div>
      )}
    </div>
  );
};

export default PrivateNotes;
