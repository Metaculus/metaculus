"use client";

import "./editor.css";

import { Field, Input, Label } from "@headlessui/react";
import { ApiError } from "next/dist/server/api-utils";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";

import { updateNotebook } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import PostDefaultProject from "@/components/post_default_project";
import Button from "@/components/ui/button";
import { useContentTranslatedBannerContext } from "@/contexts/translations_banner_context";
import { PostStatus, NotebookPost, ProjectPermissions } from "@/types/post";

interface NotebookEditorProps {
  postData: NotebookPost;
  contentId?: string;
}

const NotebookEditor: React.FC<NotebookEditorProps> = ({
  postData,
  contentId,
}) => {
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(postData.title);
  const [markdown, setMarkdown] = useState(postData.notebook.markdown);

  const allowModifications =
    [ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(
      postData.user_permission
    ) ||
    (postData.user_permission === ProjectPermissions.CREATOR &&
      postData.curation_status !== PostStatus.APPROVED);

  const toggleEditMode = async () => {
    if (isEditing) {
      try {
        setError(null);
        await updateNotebook(postData.id, markdown, title);
      } catch (error) {
        const errorData = error as ApiError;
        setError(errorData.message);
      }
    }

    setIsEditing((prev) => !prev);
  };

  const { setBannerIsVisible } = useContentTranslatedBannerContext();
  const locale = useLocale();

  useEffect(() => {
    if (postData.is_current_content_translated) {
      setBannerIsVisible(true);
    }
  }, [postData, locale]);

  const defaultProject = postData.projects.default_project;
  return (
    <div>
      <div className="flex">
        <PostDefaultProject defaultProject={defaultProject} />
        {allowModifications && (
          <Button className="ml-auto p-2" onClick={toggleEditMode}>
            {isEditing ? "save" : "edit"}
          </Button>
        )}
      </div>

      {error && (
        <div className="text-red-500 dark:text-red-500-dark">{error}</div>
      )}

      {isEditing && (
        <div className="flex flex-col">
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
          <MarkdownEditor mode="read" markdown={markdown} withTwitterPreview />
        </div>
      )}
    </div>
  );
};

export default NotebookEditor;
