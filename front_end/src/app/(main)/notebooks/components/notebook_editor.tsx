"use client";

import { notFound } from "next/navigation";
import React, { useState } from "react";

import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { PostWithForecasts } from "@/types/post";

import { updateNotebook } from "../../questions/actions";

interface NotebookEditorProps {
  postData: PostWithForecasts;
}

const NotebookEditor: React.FC<NotebookEditorProps> = ({ postData }) => {
  const [mode, setMode] = useState<"readOnly" | "extended">("readOnly");
  const [title, setTitle] = useState(postData.title);
  // @ts-ignore
  const [markdown, setMarkdown] = useState(postData.notebook.markdown);

  const handleSave = async () => {
    await updateNotebook(postData.id, markdown, title);
  };

  return (
    <div className="mt-4 p-2">
      <div>
        <Button
          className="text-ll mb-6 p-2"
          onClick={() => {
            if (mode == "extended") {
              handleSave();
            }
            setMode(mode === "readOnly" ? "extended" : "readOnly");
          }}
        >
          {mode === "readOnly" ? "Edit" : "Save"}
        </Button>
      </div>
      {mode === "extended" ? (
        <div>
          <Input
            className="w-full max-w-[600px]"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
      ) : (
        <div className="text-2xl">{title}</div>
      )}
      <MarkdownEditor markdown={markdown} mode={mode} onChange={setMarkdown} />
    </div>
  );
};

export default NotebookEditor;
