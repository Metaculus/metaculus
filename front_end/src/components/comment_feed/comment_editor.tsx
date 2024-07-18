"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

import IncludedForecast from "./included_forecast";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

interface CommentEditorProps {
  text?: string;
  isPrivate?: boolean;
  postId?: number;
  parentId?: number;
}

const CommentEditor: React.FC<CommentEditorProps> = ({
  text,
  isPrivate,
  postId,
  parentId,
}) => {
  const t = useTranslations();

  const [isEditing, setIsEditing] = useState(true);
  const [isPrivateComment, setIsPrivateComment] = useState(isPrivate ?? false);
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const [markdown, setMarkdown] = useState(text ?? "");

  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  if (user == null)
    return (
      <>
        <Textarea
          disabled
          placeholder={t("youMustLogInToComment")}
          className="mt-4 w-full bg-gray-100 dark:bg-gray-100-dark"
        />
        <div className="my-4 flex justify-end gap-3">
          <Button onClick={() => setCurrentModal({ type: "signin" })}>
            {t("logIn")}
          </Button>
        </div>
      </>
    );

  return (
    <>
      {/* TODO: this box can only be shown in create, not edit mode */}
      {/* TODO: the user should only see the checkbox if they have made a forecast! */}
      <Checkbox
        checked={hasIncludedForecast}
        onChange={(checked) => {
          setHasIncludedForecast(checked);
        }}
        label={t("includeMyForecast")}
        className="p-1 text-sm"
      />
      {/* TODO: display in preview mode only */}
      {/*comment.included_forecast && (
        <IncludedForecast author="test" forecastValue={test} />
      )*/}
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

      <div className="flex items-center justify-end gap-3">
        <Checkbox
          checked={isPrivateComment}
          onChange={(checked) => {
            setIsPrivateComment(checked);
          }}
          label={t("privateComment")}
          className="text-sm"
        />
        <Button
          disabled={markdown.length === 0}
          className="p-2"
          onClick={() => {
            setIsEditing((prev) => !prev);
          }}
        >
          {isEditing ? t("preview") : t("edit")}
        </Button>
        {!isEditing && (
          <Button
            className="p-2"
            onClick={async () => {
              const newComment = await createComment({
                parent: parentId,
                text: markdown,
                on_post: postId,
                included_forecast: hasIncludedForecast,
                is_private: isPrivateComment,
              });
            }}
          >
            {t("submit")}
          </Button>
        )}
      </div>
    </>
  );
};

export default CommentEditor;
