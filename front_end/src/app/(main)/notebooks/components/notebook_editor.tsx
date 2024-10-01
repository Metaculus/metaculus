"use client";

import { Field, Input, Label } from "@headlessui/react";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { updateNotebook } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import PostDefaultProject from "@/components/post_default_project";
import Button from "@/components/ui/button";
import { PostWithNotebook } from "@/types/post";

interface NotebookEditorProps {
  postData: PostWithNotebook;
  contentId?: string;
}

const NotebookEditor: React.FC<NotebookEditorProps> = ({
  postData,
  contentId,
}) => {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(postData.title);
  const [markdown, setMarkdown] = useState(postData.notebook.markdown);

  const toggleEditMode = () => {
    if (isEditing) {
      void updateNotebook(postData.id, markdown, title);
    }

    setIsEditing((prev) => !prev);
  };
  const defaultProject = postData.projects.default_project;
  return (
    <div>
      <div className="flex">
        <PostDefaultProject defaultProject={defaultProject} />

        <Button className="ml-auto p-2" onClick={toggleEditMode}>
          {isEditing ? "save" : "edit"}
        </Button>
      </div>

      {isEditing && (
        <div className={classNames("flex flex-col")}>
          <Field className="my-2 flex items-center gap-1">
            <Label>{t("Title")}</Label>
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
      )}

      {!isEditing && (
        <div id={contentId}>
          <MarkdownEditor mode="read" markdown={markdown} />
        </div>
      )}
    </div>
  );
};

export default NotebookEditor;
