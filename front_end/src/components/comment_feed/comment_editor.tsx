"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useEffect, useState } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/form_field";
import { userTagPattern } from "@/constants/comments";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { CommentType } from "@/types/comment";
import cn from "@/utils/cn";
import { parseComment } from "@/utils/comments";

import { validateComment } from "./validate_comment";

interface CommentEditorProps {
  text?: string;
  postId?: number;
  parentId?: number;
  shouldIncludeForecast?: boolean;
  onSubmit?: (newComment: CommentType) => void;
  isReplying?: boolean;
  replyUsername?: string;
  isPrivateFeed?: boolean;
}

const CommentEditor: FC<CommentEditorProps> = ({
  text,
  postId,
  parentId,
  onSubmit,
  shouldIncludeForecast,
  isReplying = false,
  replyUsername,
  isPrivateFeed = false,
}) => {
  const t = useTranslations();
  /* TODO: Investigate the synchronization between the internal state of MDXEditor and the external state. */
  /* Currently, manually updating the markdown state outside of MDXEditor only affects our local state, while the editor retains its previous state.
   As a temporary workaround, we use the 'key' prop to force a re-render, creating a new instance of the component with the updated initial state.
   This ensures the editor reflects the correct markdown content. */
  const [rerenderKey, updateRerenderKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isPrivateComment, setIsPrivateComment] = useState(isPrivateFeed);
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const [markdown, setMarkdown] = useState(text ?? "");
  const [isMarkdownDirty, setIsMarkdownDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | ReactNode>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  useEffect(() => {
    if (!isReplying) {
      setIsPrivateComment(isPrivateFeed);
    }
  }, [isPrivateFeed, isReplying]);

  const handleSubmit = async () => {
    setErrorMessage("");
    setIsLoading(true);
    if (user && !PUBLIC_MINIMAL_UI) {
      const validateMessage = validateComment(markdown, user, t);
      if (validateMessage) {
        setErrorMessage(validateMessage);
        setIsLoading(false);
        return;
      }
    }
    sendGAEvent("event", "postComment", {
      event_label: hasIncludedForecast ? "predictionIncluded" : null,
    });

    try {
      const parsedMarkdown = markdown.replace(userTagPattern, (match) =>
        match.replace(/[\\]/g, "")
      );

      const newComment = await createComment({
        parent: parentId,
        text: parsedMarkdown,
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
      setHasIncludedForecast(false);
      setMarkdown("");
      setIsMarkdownDirty(false);
      updateRerenderKey((prev) => prev + 1); // completely reset mdx editor

      onSubmit?.(parseComment(newComment));
    } finally {
      setIsLoading(false);
    }
  };
  const handleMarkdownChange = (newMarkdown: string) => {
    setIsMarkdownDirty(!!newMarkdown);
    setMarkdown(newMarkdown);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
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
      <div
        className={cn("border border-gray-500 dark:border-gray-500-dark", {
          hidden: !isEditing,
        })}
      >
        <MarkdownEditor
          key={rerenderKey}
          mode="write"
          markdown={markdown}
          onChange={handleMarkdownChange}
          shouldConfirmLeave={isMarkdownDirty}
          withUgcLinks
          withUserMentions
          initialMention={replyUsername}
        />
      </div>
      {!isEditing && (
        <MarkdownEditor mode="read" markdown={markdown} withUgcLinks />
      )}
      {(isReplying || hasInteracted) && (
        <div className="my-4 flex items-center justify-end gap-3">
          {!isReplying && isPrivateFeed && (
            <span className="text-sm text-gray-600 dark:text-gray-600-dark">
              {t("youArePostingAPrivateComment")}
            </span>
          )}
          <Button
            disabled={markdown.length === 0}
            className="p-2"
            onClick={() => {
              setIsEditing((prev) => !prev);
              if (errorMessage) {
                setErrorMessage("");
              }
            }}
          >
            {isEditing ? t("preview") : t("edit")}
          </Button>

          <Button
            className="p-2"
            disabled={markdown.length === 0 || isLoading}
            onClick={handleSubmit}
          >
            {t("submit")}
          </Button>
        </div>
      )}
      {!!errorMessage && (
        <div className="text-end text-red-500 dark:text-red-500-dark">
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default CommentEditor;
