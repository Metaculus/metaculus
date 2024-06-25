"use client";
import dynamic from "next/dynamic";
import { FC } from "react";

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
    <div ref={ref}>
      {!!width && (
        <MarkdownEditor
          mode="read"
          markdown={getNotebookSummary(notebook.markdown, width, 40)}
          contentEditableClassName="!m-0 *:m-0 line-clamp-2 !text-sm !text-gray-800 !dark:text-gray-800-dark"
        />
      )}
    </div>
  );
};

export default NotebookTile;
