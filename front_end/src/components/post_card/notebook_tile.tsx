"use client";
import Image from "next/image";
import { FC } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import useContainerSize from "@/hooks/use_container_size";
import { NotebookPost } from "@/types/post";
import { getMarkdownSummary } from "@/utils/markdown";

const NOTEBOOK_THUMBNAIL_HEIGHT = 96;
// Below this rendered tile width (Tailwind `sm`) we drop the thumbnail so the
// text can use the full width. Covers both narrow causes: multi-column grid
// tiles (~480-520px) and narrow-screen devices.
const NARROW_TILE_THRESHOLD = 640;
const NOTEBOOK_IMAGE_WIDTH = 176; // matches the image's min-w-44/max-w-44
const NOTEBOOK_IMAGE_GAP = 16; // matches the container's gap-4

type Props = {
  post: NotebookPost;
};

const NotebookTile: FC<Props> = ({ post }) => {
  const { ref, width } = useContainerSize<HTMLDivElement>();

  const { notebook } = post;
  const hasImageUrl =
    !!notebook.image_url && notebook.image_url.startsWith("https:");
  const hasImage = hasImageUrl && width >= NARROW_TILE_THRESHOLD;
  const textWidth = hasImage
    ? width - NOTEBOOK_IMAGE_WIDTH - NOTEBOOK_IMAGE_GAP
    : width;

  return (
    <div ref={ref} className="flex gap-4">
      <div
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
                width: textWidth,
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
