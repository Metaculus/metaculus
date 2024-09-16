"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { CommentType } from "@/types/comment";
import { parseComment } from "@/utils/comments";

interface CommentEditorProps {
  text?: string;
  isPrivate?: boolean;
  postId?: number;
  parentId?: number;
  shouldIncludeForecast?: boolean;
  onSubmit?: (newComment: CommentType) => void;
  isReplying?: boolean;
}

const CommentEditor: FC<CommentEditorProps> = ({
  text,
  isPrivate,
  postId,
  parentId,
  onSubmit,
  shouldIncludeForecast,
  isReplying = false,
}) => {
  const t = useTranslations();
  /* TODO: Investigate the synchronization between the internal state of MDXEditor and the external state. */
  /* Currently, manually updating the markdown state outside of MDXEditor only affects our local state, while the editor retains its previous state.
   As a temporary workaround, we use the 'key' prop to force a re-render, creating a new instance of the component with the updated initial state.
   This ensures the editor reflects the correct markdown content. */
  const [rerenderKey, updateRerenderKey] = useState(0);
  const [isEditing, setIsEditing] = useState(true);
  const [isPrivateComment, setIsPrivateComment] = useState(isPrivate ?? false);
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const [markdown, setMarkdown] = useState(text ?? "");
  const [errorMessage, setErrorMessage] = useState<string>();

  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const handleSubmit = async () => {
    setErrorMessage("");
    const newComment = await createComment({
      parent: parentId,
      text: markdown,
      on_post: postId,
      included_forecast: hasIncludedForecast,
      is_private: isPrivateComment,
    });

    if ("errors" in newComment) {
      console.error(newComment.errors?.message);
      setErrorMessage(newComment.errors?.message);
      return;
    }

    setIsEditing(true);
    setIsPrivateComment(isPrivate ?? false);
    setHasIncludedForecast(false);
    setMarkdown("");
    updateRerenderKey((prev) => prev + 1); // completely reset mdx editor
    onSubmit && onSubmit(parseComment(newComment));
  };

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

      {shouldIncludeForecast && (
        <Checkbox
          checked={hasIncludedForecast}
          onChange={(checked) => {
            setHasIncludedForecast(checked);
          }}
          label={t("includeMyForecast")}
          className="p-1 text-sm"
        />
      )}
      {/* TODO: display in preview mode only */}
      {/*comment.included_forecast && (
        <IncludedForecast author="test" forecastValue={test} />
      )*/}
      {isEditing && (
        <div className="border border-gray-500 dark:border-gray-500-dark">
          <MarkdownEditor
            key={rerenderKey}
            mode="write"
            markdown={markdown}
            onChange={setMarkdown}
          />
        </div>
      )}
      {!isEditing && <MarkdownEditor mode="read" markdown={markdown} />}

      <div className="my-4 flex items-center justify-end gap-3">
        {!isReplying && (
          <Checkbox
            checked={isPrivateComment}
            onChange={(checked) => {
              setIsPrivateComment(checked);
            }}
            label={t("privateComment")}
            className="text-sm"
          />
        )}
        <Button
          disabled={markdown.length === 0}
          className="p-2"
          onClick={() => {
            setIsEditing((prev) => !prev);
            !!errorMessage && setErrorMessage("");
          }}
        >
          {isEditing ? t("preview") : t("edit")}
        </Button>

        <Button
          className="p-2"
          disabled={markdown.length === 0}
          onClick={handleSubmit}
        >
          {t("submit")}
        </Button>
      </div>
      {!!errorMessage && (
        <div className="text-end text-red-500 dark:text-red-500-dark">
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default CommentEditor;
