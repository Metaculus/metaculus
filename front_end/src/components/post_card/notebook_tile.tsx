"use client";
import Image from "next/image";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import useContainerSize from "@/hooks/use_container_size";
import { NotebookPost } from "@/types/post";
import { getMarkdownSummary } from "@/utils/markdown";

const NOTEBOOK_THUMBNAIL_HEIGHT = 96;

type Props = {
  post: NotebookPost;
  fullBackground?: boolean;
};

const NotebookTile: FC<Props> = ({ post, fullBackground = false }) => {
  const { ref, width } = useContainerSize<HTMLDivElement>();

  const { notebook } = post;
  const hasImage =
    !!notebook.image_url && notebook.image_url.startsWith("https:");

  if (fullBackground) {
    return (
      <div ref={ref} className="min-w-0">
        {!!width && (
          <MarkdownEditor
            mode="read"
            markdown={
              notebook.feed_tile_summary ||
              getMarkdownSummary({
                markdown: notebook.markdown,
                width,
                height: 80,
              })
            }
            contentEditableClassName="!m-0 line-clamp-3 !text-sm !leading-5 !text-gray-0 *:m-0 dark:!text-gray-0-dark"
            withUgcLinks
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div
        ref={ref}
        className={
          hasImage ? "h-24 min-w-0 flex-1 overflow-hidden" : "min-w-0 flex-1"
        }
      >
        {!!width && (
          <MarkdownEditor
            mode="read"
            markdown={
              notebook.feed_tile_summary ||
              getMarkdownSummary({
                markdown: notebook.markdown,
                width,
                height: hasImage ? NOTEBOOK_THUMBNAIL_HEIGHT : 80,
              })
            }
            contentEditableClassName={
              hasImage
                ? "!m-0 *:m-0 !text-sm !leading-5 !text-gray-800 !dark:text-gray-800-dark"
                : "!m-0 *:m-0 line-clamp-2 !text-sm !text-gray-800 !dark:text-gray-800-dark"
            }
            withUgcLinks
          />
        )}
      </div>
      {hasImage && (
        <Image
          src={notebook.image_url as string}
          alt=""
          width={300}
          height={300}
          unoptimized
          className="h-24 min-w-44 max-w-44 rounded object-cover"
        />
      )}
    </div>
  );
};

export default NotebookTile;
