"use client";

import { Field, Input, Label } from "@headlessui/react";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { updateNotebook } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import { PostWithNotebook } from "@/types/post";
import Link from "next/link";
import { TournamentType } from "@/types/projects";

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
        {[
          TournamentType.Tournament,
          TournamentType.GlobalLeaderboard,
          TournamentType.QuestionSeries,
        ].includes(defaultProject.type) && (
          <Link
            className="inline-flex items-center justify-center gap-1 rounded-l rounded-r border-inherit bg-orange-100 p-1.5 text-sm font-medium leading-4 text-orange-900 no-underline hover:bg-orange-200 dark:bg-orange-100-dark dark:text-orange-900-dark hover:dark:bg-orange-200-dark"
            href={`/tournament/${defaultProject.slug}`}
          >
            {defaultProject.name}
          </Link>
        )}
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
