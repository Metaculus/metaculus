"use client";

import { MDXEditorMethods } from "@mdxeditor/editor";
import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef, useState } from "react";

import { createComment } from "@/app/(main)/questions/actions";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormErrorMessage, Textarea } from "@/components/ui/form_field";
import { userTagPattern } from "@/constants/comments";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useDebouncedValue } from "@/hooks/use_debounce";
import useSearchParams from "@/hooks/use_search_params";
import { CommentType } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { parseComment } from "@/utils/comments";
import {
  saveCommentDraft,
  getCommentDraft,
  deleteCommentDraft,
  cleanupCommentDrafts,
} from "@/utils/drafts/comments";

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
  const [hasIncludedForecast, setHasIncludedForecast] = useState(false);
  const [markdown, setMarkdown] = useState(text ?? "");
  const debouncedMarkdown = useDebouncedValue(markdown, 1000);
  const [errorMessage, setErrorMessage] = useState<string | ErrorResponse>();
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

  // Load comment draft and remove old ones on mount
  useEffect(() => {
    if (postId && user?.id) {
      cleanupCommentDrafts();
      const draft = getCommentDraft(user.id, postId, parentId);
      if (draft) {
        setMarkdown(draft.markdown ?? "");
        setHasIncludedForecast(draft.includeForecast ?? false);
        editorRef.current?.setMarkdown(draft.markdown ?? "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // save draft on debounced markdown change
  useEffect(() => {
    if (!isNil(postId) && hasInteracted && user) {
      saveCommentDraft({
        markdown: debouncedMarkdown,
        includeForecast: hasIncludedForecast,
        lastModified: Date.now(),
        userId: user.id,
        postId,
        parentId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMarkdown, hasIncludedForecast, postId, parentId]);

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
        setErrorMessage(t("outdatedServerActionMessage"));
        return;
      }

      if (!!response && "errors" in response) {
        setErrorMessage(response.errors as ErrorResponse);
        return;
      }

      // Delete the draft after successful submission
      if (postId && user) {
        deleteCommentDraft({ userId: user.id, postId, parentId });
      }

      setHasIncludedForecast(false);
      setMarkdown("");
      editorRef.current?.setMarkdown("");
      setEditorRenderKey((prev) => prev + 1);
      onSubmit?.(parseComment(response));
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
        ref={editorWrapperRef}
        className="scroll-mt-24 border border-gray-500 dark:border-gray-500-dark"
      >
        <MarkdownEditor
          key={editorRenderKey}
          ref={editorRef}
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
      <FormErrorMessage
        errors={errorMessage}
        containerClassName="text-balance text-center text-red-500 dark:text-red-500-dark"
      />
    </>
  );
};

export default CommentEditor;
