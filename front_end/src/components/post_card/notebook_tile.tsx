"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FC } from "react";

import imagePlaceholder from "@/app/assets/images/tournament.webp";
import useContainerSize from "@/hooks/use_container_size";
import { Notebook } from "@/types/post";
import { getNotebookSummary } from "@/utils/questions";
const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

type Props = {
  notebook: Notebook;
};

const NotebookTile: FC<Props> = ({ notebook }) => {
  const { ref, width } = useContainerSize<HTMLDivElement>();

  return (
    <div ref={ref} className="flex gap-4">
      {!!width && (
        <MarkdownEditor
          mode="read"
          markdown={getNotebookSummary(notebook.markdown, width, 40)}
          contentEditableClassName="!m-0 *:m-0 line-clamp-2 !text-sm !text-gray-800 !dark:text-gray-800-dark"
        />
      )}
      <Image
        src={imagePlaceholder}
        alt=""
        className="h-24 min-w-44 max-w-44 rounded object-cover"
      />
    </div>
  );
};

export default NotebookTile;
