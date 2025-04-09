"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, ReactNode, useEffect, useRef, useState } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/form_field";
import { userTagPattern } from "@/constants/comments";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useDebouncedValue } from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";
import { CommentType } from "@/types/comment";
import {
  saveCommentDraft,
  getCommentDraft,
  deleteCommentDraft,
  cleanupOldDrafts,
} from "@/utils/comments";
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
  const [isPrivateComment, setIsPrivateComment] = useState(isPrivateFeed);
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const [markdown, setMarkdown] = useState(text ?? "");
  const debouncedMarkdown = useDebouncedValue(markdown, 2000);
  const [isMarkdownDirty, setIsMarkdownDirty] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | ReactNode>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const { params, clearParams, shallowNavigateToSearchParams } =
    useSearchParams();
  useEffect(() => {
    if (!isReplying) {
      setIsPrivateComment(isPrivateFeed);
    }
  }, [isReplying, isPrivateFeed]);

  // Load comment draft and remove old ones on mount
  useEffect(() => {
    if (postId) {
      cleanupOldDrafts();
      const draft = getCommentDraft(postId, parentId);
      if (draft) {
        setMarkdown(draft.markdown);
        setIsPrivateComment(draft.isPrivate);
        setHasIncludedForecast(draft.includeForecast);
      }
      updateRerenderKey((prev) => prev + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // save draft on debounced markdown change
  useEffect(() => {
    if (!isNil(postId) && hasInteracted && isMarkdownDirty) {
      saveCommentDraft({
        markdown: debouncedMarkdown,
        isPrivate: isPrivateComment,
        includeForecast: hasIncludedForecast,
        lastModified: Date.now(),
        postId,
        parentId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedMarkdown,
    isPrivateComment,
    hasIncludedForecast,
    postId,
    parentId,
  ]);

  useEffect(() => {
    if (params.get("action") === "comment-with-forecast") {
      // Remove the parameter from URL
      clearParams(false);
      shallowNavigateToSearchParams();

      // Scroll to editor
      editorRef.current?.scrollIntoView({
        behavior: "smooth",
      });

      // Set the forecast checkbox
      setHasIncludedForecast(true);
    }
  }, [params, clearParams, shallowNavigateToSearchParams]);

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
        const errorMessage =
          newComment.errors?.message ??
          newComment.errors?.non_field_errors?.[0];

        setErrorMessage(errorMessage);
        return;
      }

      // Delete the draft after successful submission
      if (postId) {
        deleteCommentDraft(postId, parentId);
      }

      setHasIncludedForecast(false);
      setMarkdown("");
      setIsMarkdownDirty(false);

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
        ref={editorRef}
        className="scroll-mt-24 border border-gray-500 dark:border-gray-500-dark"
      >
        <MarkdownEditor
          key={rerenderKey}
          mode="write"
          markdown={markdown}
          onChange={handleMarkdownChange}
          withUgcLinks
          withUserMentions
          initialMention={!markdown.trim() ? replyUsername : undefined} // only populate with mention if there is no draft
        />
      </div>
      {(isReplying || hasInteracted) && (
        <div className="my-4 flex items-center justify-end gap-3">
          {!isReplying && isPrivateFeed && (
            <span className="text-sm text-gray-600 dark:text-gray-600-dark">
              {t("youArePostingAPrivateComment")}
            </span>
          )}
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
        <div className="text-balance text-center text-red-500 dark:text-red-500-dark">
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default CommentEditor;
