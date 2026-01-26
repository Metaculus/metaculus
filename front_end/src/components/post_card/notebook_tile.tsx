"use client";
import Image from "next/image";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import useContainerSize from "@/hooks/use_container_size";
import { NotebookPost } from "@/types/post";
import { getMarkdownSummary } from "@/utils/markdown";

type Props = {
  post: NotebookPost;
};

const NotebookTile: FC<Props> = ({ post }) => {
  const { ref, width } = useContainerSize<HTMLDivElement>();

  const { notebook } = post;

  return (
    <div ref={ref} className="flex gap-4">
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
          contentEditableClassName="!m-0 *:m-0 line-clamp-2 !text-sm !text-gray-800 !dark:text-gray-800-dark"
          withUgcLinks
        />
      )}
      {notebook.image_url && notebook.image_url.startsWith("https:") && (
        <Image
          src={notebook.image_url}
          alt=""
          width={300}
          height={300}
          quality={100}
          className="h-24 min-w-44 max-w-44 rounded object-cover"
        />
      )}
    </div>
  );
};

export default NotebookTile;
