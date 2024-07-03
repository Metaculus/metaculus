/* eslint-disable */
"use client";

import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

import { useState } from "react";
import Button from "@/components/ui/button";
import { createQuestionPost } from "../../actions";
import { useTranslations } from "next-intl";

const NotebookCreator: React.FC = ({}) => {
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const t = useTranslations();

  return (
    <div className="h-50vh mx-auto mb-8 mt-4 max-w-3xl overflow-auto rounded-lg bg-gray-0 p-6 dark:bg-gray-100-dark">
      <input
        className="mb-4 p-1 pl-2 text-xl"
        type="text"
        placeholder={t("Title")}
        onChange={(e) => setTitle(e.target.value)}
      ></input>
      <div className="pl-2">
        <MarkdownEditor
          markdown={markdown}
          onChange={setMarkdown}
          mode="write"
        />
      </div>
      <div className="pl-2">
        <Button
          className="text-xl"
          onClick={async () => {
            createQuestionPost({
              title: title,
              notebook: {
                type: "discussion",
                image_url: null,
                markdown: markdown,
              },
            });
          }}
        >
          Create Notebook
        </Button>
      </div>
    </div>
  );
};

export default NotebookCreator;
