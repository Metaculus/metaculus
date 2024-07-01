"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

interface NotebookEditorProps {
  commentText?: string;
}

const CommentEditor: React.FC<NotebookEditorProps> = ({ commentText }) => {
  const [isEditing, setIsEditing] = useState(true);

  const [markdown, setMarkdown] = useState(commentText ?? "");

  const toggleEditMode = () => {
    if (isEditing) {
      //void updateNotebook(postData.id, markdown, title);
    }

    setIsEditing((prev) => !prev);
  };

  return (
    <>
      {isEditing && (
        <div className="flex flex-col">
          <MarkdownEditor
            mode="write"
            markdown={markdown}
            onChange={setMarkdown}
          />
        </div>
      )}
      {!isEditing && <MarkdownEditor mode="read" markdown={markdown} />}

      <div className="flex justify-end gap-3">
        <Button className="p-2" onClick={toggleEditMode}>
          {isEditing ? "Preview" : "Edit"}
        </Button>
        {!isEditing && (
          <Button
            className="p-2"
            onClick={() => {
              createComment({
                /* test data */
                author: 104161,
                parent: null,
                text: markdown,
                on_post: 1,
                included_forecast: null,
              });
            }}
          >
            Save
          </Button>
        )}
      </div>
    </>
  );
};

export default CommentEditor;
