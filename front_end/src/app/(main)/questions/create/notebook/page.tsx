/* eslint-disable */
"use client";

import dynamic from "next/dynamic";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

import { useState } from "react";
import Button from "@/components/ui/button";
import { createQuestionPost } from "../../actions";

const NotebookCreator: React.FC = ({}) => {
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");

  return (
    <div className="h-50vh mx-auto mb-8 mt-4 max-w-3xl overflow-auto rounded-lg bg-gray-0 p-6 dark:bg-gray-100-dark">
      <input
        className="text-xl"
        type="text"
        placeholder="Title of this notebook"
        onChange={(e) => setTitle(e.target.value)}
      ></input>
      <div className="m-2  mb-4">
        <input type="text" className="w-full max-w-[600px] p-1 text-xl" />
      </div>
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
                type: "notebook",
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
