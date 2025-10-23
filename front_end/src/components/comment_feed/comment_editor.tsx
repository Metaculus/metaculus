"use client";

import { MDXEditorMethods } from "@mdxeditor/editor";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useRef, useState } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormErrorMessage, Textarea } from "@/components/ui/form_field";
import { userTagPattern } from "@/constants/comments";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useCommentDraft } from "@/hooks/use_comment_draft";
import useSearchParams from "@/hooks/use_search_params";
import { CommentType } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import { sendAnalyticsEvent } from "@/utils/analytics";
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

  /**
   * Manually updating the markdown state outside of MDXEditor only affects
   * our local state, while the editor retains its previous state. As a workaround,
   * we use the setMarkdown function in editorRef to update the editor's state.
   */
  const editorRef = useRef<MDXEditorMethods>(null);
  /**
   * Key is used to force editor reset after submission.
   * This is a workaround for MDX editor issue when`setMarkdown` method won't properly update editor state if the user is on the "source" mode
   */
  const [editorRenderKey, setEditorRenderKey] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isPrivateComment, setIsPrivateComment] = useState(isPrivateFeed);
  const [clientError, setClientError] = useState<React.ReactNode>(null);
  const [serverError, setServerError] = useState<string | ErrorResponse>();
  const [hasInteracted, setHasInteracted] = useState(false);
  const editorWrapperRef = useRef<HTMLDivElement>(null);
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

  const {
    draftReady,
    initialMarkdown,
    setInitialMarkdown,
    stopAndDiscardDraft,
    markdownRef,
    hasIncludedForecast,
    setHasIncludedForecast,
    hasContent,
    setHasContent,
    saveDraftDebounced,
  } = useCommentDraft({
    text,
    postId,
    parentId,
    userId: user?.id,
  });

  useEffect(() => {
    if (params.get("action") === "comment-with-forecast") {
      // Remove the parameter from URL
      clearParams(false);
      shallowNavigateToSearchParams();

      // Scroll to editor
      editorWrapperRef.current?.scrollIntoView({
        behavior: "smooth",
      });

      // Set the forecast checkbox
      setHasIncludedForecast(true);
    }
  }, [
    params,
    clearParams,
    shallowNavigateToSearchParams,
    setHasIncludedForecast,
  ]);

  useEffect(() => {
    if (draftReady && (initialMarkdown?.trim().length ?? 0) > 0) {
      setHasInteracted(true);
    }
  }, [draftReady, initialMarkdown]);

  const handleSubmit = async () => {
    setClientError(null);
    setServerError(undefined);
    setIsLoading(true);

    const markdown = markdownRef.current ?? "";

    if (user && !PUBLIC_MINIMAL_UI) {
      const validateNode = validateComment(markdown.trim(), user, t);
      if (validateNode) {
        setClientError(validateNode);
        setIsLoading(false);
        return;
      }
    }

    sendAnalyticsEvent("postComment", {
      event_label: hasIncludedForecast ? "predictionIncluded" : null,
    });

    try {
      const parsedMarkdown = markdown.replace(userTagPattern, (match) =>
        match.replace(/[\\]/g, "")
      );

      const response = await createComment({
        parent: parentId,
        text: parsedMarkdown,
        on_post: postId,
        included_forecast: hasIncludedForecast,
        is_private: isPrivateComment,
      });

      if (!response) {
        setServerError(t("outdatedServerActionMessage"));
        return;
      }
      if (!!response && "errors" in response) {
        setServerError(response.errors as ErrorResponse);
        return;
      }

      stopAndDiscardDraft();

      setHasIncludedForecast(false);
      markdownRef.current = "";
      setHasContent(false);
      setInitialMarkdown("");
      setEditorRenderKey((prev) => prev + 1);
      onSubmit?.(parseComment(response));
    } finally {
      setIsLoading(false);
    }
  };
  const handleMarkdownChange = useCallback(
    (next: string) => {
      markdownRef.current = next;
      if (!draftReady) return;
      if (!hasInteracted) {
        setHasInteracted(true);
      }
      setHasContent(next.trim().length > 0);
      saveDraftDebounced(next);
    },
    [draftReady, hasInteracted, saveDraftDebounced, setHasContent, markdownRef]
  );

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
      {clientError && (
        <div className="mt-3 rounded-tl-md rounded-tr-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950 dark:text-red-200">
          {clientError}
        </div>
      )}

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
        ref={editorWrapperRef}
        className="scroll-mt-24 border border-gray-500 dark:border-gray-500-dark"
      >
        {draftReady && (
          <MarkdownEditor
            key={editorRenderKey}
            ref={editorRef}
            mode="write"
            markdown={initialMarkdown}
            onChange={handleMarkdownChange}
            withUgcLinks
            withUserMentions
            initialMention={!initialMarkdown.trim() ? replyUsername : undefined} // only populate with mention if there is no draft
            withCodeBlocks
            contentEditableClassName="text-base sm:text-inherit"
          />
        )}
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
            disabled={!hasContent || isLoading}
            onClick={handleSubmit}
          >
            {t("submit")}
          </Button>
        </div>
      )}
      <FormErrorMessage
        errors={serverError}
        containerClassName="text-balance text-center text-red-500 dark:text-red-500-dark"
      />
    </>
  );
};

export default CommentEditor;
