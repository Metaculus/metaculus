"use client";

import { Field, Input, Label } from "@headlessui/react";
import classNames from "classnames";
import dynamic from "next/dynamic";
import React, { useState } from "react";

import { updateNotebook } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { PostWithNotebook } from "@/types/post";
const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

interface NotebookEditorProps {
  postData: PostWithNotebook;
  contentId?: string;
}

const NotebookEditor: React.FC<NotebookEditorProps> = ({
  postData,
  contentId,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(postData.title);
  const [markdown, setMarkdown] = useState(postData.notebook.markdown);

  const toggleEditMode = () => {
    if (isEditing) {
      void updateNotebook(postData.id, markdown, title);
    }

    setIsEditing((prev) => !prev);
  };

  return (
    <div>
      <div>
        <Button className="p-2" onClick={toggleEditMode}>
          {isEditing ? "Save" : "Edit"}
        </Button>
      </div>

      <div className={classNames("flex flex-col", { hidden: !isEditing })}>
        <Field className="my-2 flex items-center gap-1">
          <Label>Title</Label>
          <Input
            name="title"
            type="text"
            className="w-full max-w-[600px] rounded-sm border border-blue-500 p-1 dark:border-blue-500-dark"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <MarkdownEditor
          mode="write"
          markdown={markdown}
          onChange={setMarkdown}
        />
      </div>

      <div className={classNames({ hidden: isEditing })} id={contentId}>
        <MarkdownEditor mode="read" markdown={markdown} />
      </div>
    </div>
  );
};

export default NotebookEditor;
