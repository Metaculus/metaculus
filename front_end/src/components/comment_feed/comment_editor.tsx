"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { FC, useState, useEffect } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { CommentType } from "@/types/comment";
import { parseComment } from "@/utils/comments";

interface CommentEditorProps {
  text?: string;
  postId?: number;
  parentId?: number;
  shouldIncludeForecast?: boolean;
  onSubmit?: (newComment: CommentType) => void;
  isReplying?: boolean;
  isPrivateFeed?: boolean;
}

const CommentEditor: FC<CommentEditorProps> = ({
  text,
  postId,
  parentId,
  onSubmit,
  shouldIncludeForecast,
  isReplying = false,
  isPrivateFeed = false,
}) => {
  const t = useTranslations();
  const [rerenderKey, updateRerenderKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [isPrivateComment, setIsPrivateComment] = useState(isPrivateFeed);
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const [markdown, setMarkdown] = useState(text ?? "");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [hasInteracted, setHasInteracted] = useState(false);

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

    sendGAEvent("event", "postComment", {
      event_label: hasIncludedForecast ? "predictionIncluded" : null,
    });

    try {
      const userTagPattern = /@(?!\[)(?:\(([^)]+)\)|([^\s(]+)(?!\]))/g;
      const parsedMarkdown = markdown.replace(userTagPattern, (match) =>
        match.replace(/[()\\]/g, "")
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
      updateRerenderKey((prev) => prev + 1); // completely reset mdx editor
      onSubmit && onSubmit(parseComment(newComment));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkdownChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  if (user == null)
    return (
      <div className="mb-4 w-full text-center text-gray-600 dark:text-gray-600-dark">
        {t.rich("youMustLogInToComment", {
          link: (chunks) => (
            <span
              className="cursor-pointer lowercase text-blue-700 underline underline-offset-2 hover:text-blue-800 dark:text-blue-700-dark hover:dark:text-blue-800-dark"
              onClick={() => setCurrentModal({ type: "signin" })}
            >
              {chunks}
            </span>
          ),
        })}
      </div>
    );

  return (
    <>
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

      {isEditing && (
        <div className="rounded-md border border-blue-400 dark:border-blue-400-dark">
          <MarkdownEditor
            key={rerenderKey}
            mode="write"
            markdown={markdown}
            onChange={handleMarkdownChange}
          />
        </div>
      )}
      {!isEditing && <MarkdownEditor mode="read" markdown={markdown} />}

      {(isReplying || hasInteracted) && (
        <div className="my-4 flex items-center justify-end gap-3">
          {!isReplying && isPrivateFeed && (
            <span className="text-sm text-gray-600 dark:text-gray-600-dark">
              {t("youArePostingAPrivateComment")}
            </span>
          )}
          <Button
            className="p-2"
            onClick={() => {
              setIsEditing((prev) => !prev);
              !!errorMessage && setErrorMessage("");
            }}
          >
            {isEditing ? t("preview") : t("edit")}
          </Button>

          <Button className="p-2" disabled={isLoading} onClick={handleSubmit}>
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
