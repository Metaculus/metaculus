"use client";

import {
  faChevronDown,
  faPlus,
  faReply,
  faThumbtack,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { softDeleteUserAction } from "@/app/(main)/accounts/profile/actions";
import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { CommentForm } from "@/app/(main)/questions/[id]/components/comment_form";
import { AddKeyFactorsForm } from "@/app/(main)/questions/[id]/components/key_factors/add_modal";
import { useKeyFactors } from "@/app/(main)/questions/[id]/components/key_factors/hooks";
import KeyFactorsCommentSection from "@/app/(main)/questions/[id]/components/key_factors/key_factors_comment_section";
import { driverTextSchema } from "@/app/(main)/questions/[id]/components/key_factors/schemas";
import {
  createForecasts,
  editComment,
  softDeleteComment,
} from "@/app/(main)/questions/actions";
import { CoherenceLinksForm } from "@/app/(main)/questions/components/coherence_links/coherence_links_form";
import { CommentDate } from "@/components/comment_feed/comment_date";
import CommentEditor from "@/components/comment_feed/comment_editor";
import CommentReportModal from "@/components/comment_feed/comment_report_modal";
import CommentVoter from "@/components/comment_feed/comment_voter";
import { Admin } from "@/components/icons/admin";
import { Moderator } from "@/components/icons/moderator";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { userTagPattern } from "@/constants/comments";
import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useCommentDraft } from "@/hooks/use_comment_draft";
import useContainerSize from "@/hooks/use_container_size";
import useScrollTo from "@/hooks/use_scroll_to";
import { CommentType, KeyFactor } from "@/types/comment";
import { ErrorResponse } from "@/types/fetch";
import type { KeyFactorDraft } from "@/types/key_factors";
import {
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
} from "@/types/post";
import { QuestionType } from "@/types/question";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { parseUserMentions } from "@/utils/comments";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";
import { formatUsername } from "@/utils/formatters/users";
import { getMarkdownSummary } from "@/utils/markdown";
import { canPredictQuestion } from "@/utils/questions/predictions";

import { CmmOverlay, CmmToggleButton, useCmmContext } from "./comment_cmm";
import IncludedForecast from "./included_forecast";
import { validateComment } from "./validate_comment";
import { FormError, FormErrorMessage } from "../ui/form_field";
import LoadingSpinner from "../ui/loading_spiner";

import { SortOption, sortComments } from ".";
type CommentChildrenTreeProps = {
  commentChildren: CommentType[];
  expandedChildren?: boolean;
  forceExpandedChildren?: boolean;
  treeDepth: number;
  sort: SortOption;
  postData?: PostWithForecasts;
  lastViewedAt?: string;
  shouldSuggestKeyFactors?: boolean;
  isSomeChildrenUnread?: boolean;
};

const CommentChildrenTree: FC<CommentChildrenTreeProps> = ({
  commentChildren,
  expandedChildren = false,
  forceExpandedChildren = false,
  treeDepth,
  sort,
  postData,
  lastViewedAt,
  shouldSuggestKeyFactors = false,
  isSomeChildrenUnread = false,
}) => {
  const t = useTranslations();
  const sortedCommentChildren = sortComments([...commentChildren], sort);

  const [childrenExpanded, setChildrenExpanded] = useState(
    (expandedChildren && treeDepth < 5) || forceExpandedChildren
  );

  function getTreeSize(commentChildren: CommentType[]): number {
    let totalChildren = 0;
    commentChildren.forEach((comment) => {
      if (!comment.children || comment.children?.length === 0) {
        // count just this parent comment with no children
        totalChildren += 1;
      } else {
        // count this comment plus its children
        totalChildren += getTreeSize(comment.children) + 1;
      }
    });
    return totalChildren;
  }

  return (
    <>
      <div className={cn(treeDepth > 1 && "pr-1.5")}>
        <button
          className={cn(
            "mb-1 mt-2.5 flex w-full items-center justify-center gap-2 rounded-sm px-1.5 py-1 text-sm text-blue-700 no-underline hover:bg-blue-400 disabled:bg-gray-0 dark:text-blue-700-dark dark:hover:bg-blue-700/65 disabled:dark:border-blue-500-dark disabled:dark:bg-gray-0-dark md:px-2",
            {
              "border border-transparent bg-blue-400/50 dark:bg-blue-700/30":
                !childrenExpanded,
              "border border-blue-400 bg-transparent hover:bg-blue-400/50 dark:border-blue-600/50 dark:hover:bg-blue-700/50":
                childrenExpanded,
              "border border-purple-500 bg-purple-100/50 dark:border-purple-500-dark/60 dark:bg-purple-100-dark/50":
                isSomeChildrenUnread,
            }
          )}
          onClick={() => {
            setChildrenExpanded(!childrenExpanded);
          }}
        >
          <FontAwesomeIcon
            icon={faChevronDown}
            className={cn("inline-block transition-transform", {
              "-rotate-180": childrenExpanded,
            })}
          />
          <span className="no-underline">
            {childrenExpanded
              ? t("hideReplyWithCount", { count: getTreeSize(commentChildren) })
              : t("showReplyWithCount", {
                  count: getTreeSize(commentChildren),
                })}
          </span>
        </button>
      </div>
      <div
        className={cn(
          "relative",
          treeDepth < 5 ? "pl-0 md:pl-3" : null,
          childrenExpanded ? "pt-0.5" : null
        )}
      >
        {treeDepth < 5 && (
          <div
            className="absolute inset-y-0 -left-2 top-2 hidden w-4 cursor-pointer after:absolute after:inset-y-0 after:left-2 after:block after:w-px after:border-l after:border-blue-400 after:content-[''] after:hover:border-blue-600 after:dark:border-blue-600/80 after:hover:dark:border-blue-400/80 md:block"
            onClick={() => {
              setChildrenExpanded(!childrenExpanded);
            }}
          />
        )}{" "}
        {childrenExpanded &&
          sortedCommentChildren.map((child: CommentType) => {
            const isUnread =
              lastViewedAt &&
              new Date(lastViewedAt) < new Date(child.created_at);
            const opacityClass =
              treeDepth % 2 === 1
                ? "bg-blue-100 dark:bg-blue-100-dark pr-0 md:pr-1.5 border-r-0 md:border-r rounded-r-none md:rounded-r-md"
                : treeDepth === 2
                  ? "bg-blue-200 dark:bg-blue-200-dark pr-0 md:pr-1.5 border-r-0 md:border-r rounded-r-none md:rounded-r-md"
                  : "bg-blue-200 dark:bg-blue-200-dark border-r-0 pr-0.5";

            return (
              <div
                key={child.id}
                className={cn(
                  "my-1 rounded-l-md border py-1 pl-1.5 md:py-2 md:pl-3",
                  opacityClass,
                  {
                    "border-blue-500/70 dark:border-blue-400-dark": !isUnread,
                    "border-purple-500 bg-purple-100/50 dark:border-purple-500-dark/60 dark:bg-purple-100-dark/50":
                      isUnread,
                  }
                )}
              >
                <Comment
                  comment={child}
                  treeDepth={treeDepth}
                  sort={sort}
                  postData={postData}
                  lastViewedAt={lastViewedAt}
                  shouldSuggestKeyFactors={shouldSuggestKeyFactors}
                  forceExpandedChildren={forceExpandedChildren}
                />
              </div>
            );
          })}
      </div>
    </>
  );
};

type CommentProps = {
  comment: CommentType;
  handleCommentPin?: (comment: CommentType) => Promise<void>;
  onProfile?: boolean;
  treeDepth: number;
  sort: SortOption;
  postData?: PostWithForecasts;
  lastViewedAt?: string;
  isCollapsed?: boolean;
  isCommentJustCreated?: boolean;
  shouldSuggestKeyFactors?: boolean;
  forceExpandedChildren?: boolean;
};

const Comment: FC<CommentProps> = ({
  comment,
  onProfile = false,
  treeDepth,
  sort,
  postData,
  lastViewedAt,
  isCollapsed = false,
  handleCommentPin,
  isCommentJustCreated = false,
  shouldSuggestKeyFactors = false,
  forceExpandedChildren = false,
}) => {
  const t = useTranslations();
  const commentRef = useRef<HTMLDivElement>(null);
  const keyFactorFormRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editorKey, setEditorKey] = useState<number>(0);
  const originalTextRef = useRef<string>(comment.text);
  const [isDeleted, setIsDeleted] = useState(comment.is_soft_deleted);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [drafts, setDrafts] = useState<KeyFactorDraft[]>([
    {
      driver: { text: "", impact_direction: null, certainty: null },
    },
  ]);
  const [errorMessage, setErrorMessage] = useState<string | ErrorResponse>();
  const [commentMarkdown, setCommentMarkdown] = useState(comment.text);
  const [tempCommentMarkdown, setTempCommentMarkdown] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { ref, width } = useContainerSize<HTMLDivElement>();
  const { PUBLIC_MINIMAL_UI } = usePublicSettings();
  const { user, setUser } = useAuth();
  const scrollTo = useScrollTo();
  const userCanPredict = postData && canPredictQuestion(postData);
  const userForecast =
    postData?.question?.my_forecasts?.latest?.forecast_values[1] ?? 0.5;
  const isCmmButtonVisible =
    user?.id !== comment.author.id &&
    (!!postData?.question ||
      !!postData?.group_of_questions ||
      !!postData?.conditional);
  const isCmmButtonDisabled = !user || !userCanPredict;
  // TODO: find a better way to dedect whether on mobile or not. For now we need to know in JS
  // too and can't use tw classes
  const isMobileScreen = window.innerWidth < 640;

  const {
    draftReady: editDraftReady,
    initialMarkdown: editInitialMarkdown,
    saveDraftDebounced: saveEditDraftDebounced,
    deleteDraft: deleteEditDraft,
  } = useCommentDraft({
    text: comment.text,
    userId: user?.id,
    commentId: comment.id,
    onPostId: comment.on_post,
    isPrivate: comment.is_private,
  });

  useEffect(() => {
    if (isEditing && editDraftReady) {
      setCommentMarkdown(editInitialMarkdown);
    }
  }, [isEditing, editDraftReady, editInitialMarkdown]);

  const cmmContext = useCmmContext(
    comment.changed_my_mind.count,
    comment.changed_my_mind.for_this_user
  );

  const [isKeyfactorsFormOpen, setIsKeyfactorsFormOpen] = useState(false);
  const [suggestKeyFactorsFirstRender, setSuggestKeyFactorsFirstRender] =
    useState(isCommentJustCreated);

  const [loadKeyFactors, setLoadKeyFactors] = useState(
    isCommentJustCreated && shouldSuggestKeyFactors
  );

  const onKeyFactorsLoadded = (keyFactorsLoaded: boolean) => {
    setIsKeyfactorsFormOpen(keyFactorsLoaded || !suggestKeyFactorsFirstRender);
    setSuggestKeyFactorsFirstRender(false);
    setLoadKeyFactors(false);
    if (keyFactorsLoaded) {
      setTimeout(() => {
        if (keyFactorFormRef.current) {
          scrollTo(keyFactorFormRef.current.getBoundingClientRect().top);
        }
      }, 200);
    }
  };

  const { comments, setComments, combinedKeyFactors } = useCommentsFeed();
  const {
    errors: keyFactorsErrors,
    setErrors: setKeyFactorsErrors,
    suggestedKeyFactors,
    setSuggestedKeyFactors,
    isLoadingSuggestedKeyFactors,
    limitError,
    factorsLimit,
    submit,
    isPending,
    clearState,
  } = useKeyFactors({
    suggestKeyFactors: loadKeyFactors,
    user_id: user?.id,
    commentId: comment.id,
    postId: comment.on_post_data?.id,
    onKeyFactorsLoadded,
  });

  const commentKeyFactors = useMemo(
    () => combinedKeyFactors.filter((kf) => kf.comment_id === comment.id),
    [combinedKeyFactors, comment.id]
  );

  const canListKeyFactors = !postData?.notebook;
  const questionNotClosed = ![
    PostStatus.CLOSED,
    PostStatus.RESOLVED,
    PostStatus.PENDING_RESOLUTION,
  ].includes(postData?.status ?? PostStatus.CLOSED);

  const limitNotReached = factorsLimit > 0;
  const isCommentAuthor = comment.author.id === user?.id;

  const canAddKeyFactors =
    isCommentAuthor &&
    questionNotClosed &&
    limitNotReached &&
    canListKeyFactors;

  const onAddKeyFactorClick = () => {
    sendAnalyticsEvent("addKeyFactor", { event_label: "fromComment" });
    clearState();
    setDrafts([
      {
        driver: { text: "", impact_direction: null, certainty: null },
      },
    ]);
    if (isKeyfactorsFormOpen) {
      setIsKeyfactorsFormOpen(false);
    } else if (shouldSuggestKeyFactors) {
      setLoadKeyFactors(true);
    } else {
      setIsKeyfactorsFormOpen(true);
    }
  };

  const openEdit = useCallback(() => {
    setTempCommentMarkdown(originalTextRef.current);
    setIsEditing(true);
    setEditorKey((k) => k + 1);
    setCommentMarkdown(
      editDraftReady ? editInitialMarkdown : originalTextRef.current
    );
  }, [editDraftReady, editInitialMarkdown]);

  const handleSubmit = async () => {
    const result = await submit(drafts, suggestedKeyFactors);
    if (result && "errors" in result) {
      setKeyFactorsErrors(result.errors);
      return;
    }
    if (result?.comment) {
      const newComment = result.comment;

      if (user && !user.should_suggest_keyfactors) {
        // Update the user state so now the user can get suggested key factors
        setUser({ ...user, should_suggest_keyfactors: true });
      }

      const updatedComments = comments.map((comment) =>
        updateCommentKeyFactors(
          comment,
          newComment.id,
          newComment.key_factors ?? []
        )
      );

      clearState();
      setComments(updatedComments);
      setTimeout(() => {
        if (commentRef.current) {
          scrollTo(commentRef.current.getBoundingClientRect().top);
        }
      }, 500);
    }
    setIsKeyfactorsFormOpen(false);
  };

  const onCancel = () => {
    setIsKeyfactorsFormOpen(false);
    clearState();
    setDrafts([
      {
        driver: { text: "", impact_direction: null, certainty: null },
      },
    ]);
  };

  const updateForecast = async (value: number) => {
    const response = await createForecasts(comment.on_post, [
      {
        questionId: postData?.question?.id ?? 0,
        forecastData: {
          continuousCdf: null,
          probabilityYes: value,
          probabilityYesPerCategory: null,
        },
      },
    ]);
    sendAnalyticsEvent("commentChangedPrediction");
    if (response && "errors" in response && !!response.errors) {
      throw response.errors;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      logError(err, { message: `failed to copy text: ${err}` });
    }
  };
  const handleSaveComment = useCallback(async () => {
    if (!user || isLoading) {
      // usually, don't expect this, as action is available only for logged-in users
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const parsedMarkdown = commentMarkdown.replace(userTagPattern, (match) =>
        match.replace(/[\\]/g, "")
      );

      const validateMessage = PUBLIC_MINIMAL_UI
        ? null
        : validateComment(parsedMarkdown, user, t);
      if (validateMessage) {
        setErrorMessage(validateMessage);
        return;
      }

      const response = await editComment({
        id: comment.id,
        text: parsedMarkdown,
        author: user.id,
      });
      if (response && "errors" in response) {
        setErrorMessage(response.errors as ErrorResponse);
      } else {
        setCommentMarkdown(parsedMarkdown);
        setIsEditing(false);
        deleteEditDraft();
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    isLoading,
    commentMarkdown,
    comment.id,
    PUBLIC_MINIMAL_UI,
    t,
    setCommentMarkdown,
    setIsEditing,
    deleteEditDraft,
  ]);
  // scroll to comment from URL hash
  useEffect(() => {
    const match = window.location.hash.match(/#comment-(\d+)/);
    if (!match) return;

    const focus_comment_id = Number(match[1]);
    if (focus_comment_id === comment.id) {
      // timeout is used as a workaround to pages where we render client components, that can't be rendered on the server
      // (e.g. markdown editor), therefore, the actual Y position of the comment is not known until
      // the client-side rendering is complete
      const timeoutId = setTimeout(() => {
        if (commentRef.current) {
          scrollTo(commentRef.current.getBoundingClientRect().top);
        }
      }, 1000);

      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comment.id]);

  const menuItems: MenuItemProps[] = [
    {
      hidden: !isMobileScreen || !isCmmButtonVisible,
      id: "cmm",
      element: (
        <div>
          <CmmToggleButton
            cmmContext={cmmContext}
            comment_id={comment.id}
            disabled={isCmmButtonDisabled}
          />
        </div>
      ),
      onClick: () => {
        return null; // handled by the button element
      },
    },
    {
      hidden: !(user?.id === comment.author.id),
      id: "edit",
      name: t("edit"),
      onClick: openEdit,
    },
    {
      id: "copyLink",
      name: t("copyLink"),
      onClick: () => {
        const urlWithoutHash = window.location.href.split("#")[0];
        void copyToClipboard(`${urlWithoutHash}#comment-${comment.id}`);
      },
    },
    {
      hidden: !user?.is_staff,
      id: "copyId",
      name: t("copyId"),
      onClick: () => copyToClipboard(comment.id.toString()),
    },
    {
      hidden: !user?.is_superuser,
      id: "viewDjangoAdmin",
      name: t("viewInDjangoAdmin"),
      link: `/admin/comments/comment/${comment.id}/change/`,
      openNewTab: true,
    },
    {
      hidden:
        postData?.user_permission !== ProjectPermissions.ADMIN ||
        !!comment.root_id ||
        !handleCommentPin,
      id: "pinComment",
      name: comment.is_pinned ? t("unpinComment") : t("pinComment"),
      onClick: async () => {
        if (handleCommentPin) await handleCommentPin(comment);
      },
    },
    {
      hidden: !user?.id,
      id: "report",
      name: t("report"),
      onClick: () => setIsReportModalOpen(true),
    },
    {
      hidden: !user?.is_staff,
      id: "delete",
      name: t("delete"),
      onClick: async () => {
        //setDeleteModalOpen(true),
        const response = await softDeleteComment(comment.id);

        if (response && "errors" in response) {
          console.error("Error deleting comment:", response.errors);
        } else {
          setIsDeleted(true);
        }
      },
    },
    {
      hidden: !user?.is_staff,
      id: "deleteUser",
      name: t("markUserAsSpamButton"),
      onClick: async () => {
        // change this to the "soft_delete_button" component with modal
        const response = await softDeleteUserAction(comment.author.id);

        if (response && "errors" in response) {
          console.error("Error deleting User:", response.errors);
        } else {
          setIsDeleted(true);
        }
      },
    },
  ];
  const hasUnreadChildren = useCallback(
    (comment: CommentType): boolean => {
      if (!lastViewedAt) return false;

      if (new Date(lastViewedAt) < new Date(comment.created_at)) {
        return true;
      }

      return (
        comment.children?.some((child) => hasUnreadChildren(child)) ?? false
      );
    },
    [lastViewedAt]
  );

  const isSomeChildrenUnread = useMemo(
    () => hasUnreadChildren(comment),
    [comment, hasUnreadChildren]
  );

  if (isDeleted) {
    return (
      <div id={`comment-${comment.id}`} ref={commentRef}>
        {comment.included_forecast && (
          <IncludedForecast
            author={t("deletedAuthor")}
            forecast={comment.included_forecast}
          />
        )}
        <div className="my-2.5 flex flex-col items-start gap-1">
          <span className="inline-flex items-center">
            <span className="italic text-gray-600 dark:text-gray-600-dark">
              {t("deleted")}
            </span>
            <span className="mx-1">·</span>
            <CommentDate comment={comment} />
          </span>
        </div>
        <div className="italic text-gray-600 break-anywhere dark:text-gray-600-dark">
          {t("commentDeleted")}
        </div>

        {comment.children?.length > 0 && (
          <CommentChildrenTree
            commentChildren={comment.children}
            treeDepth={treeDepth + 1}
            sort={sort}
            postData={postData}
            lastViewedAt={lastViewedAt}
            shouldSuggestKeyFactors={shouldSuggestKeyFactors}
            forceExpandedChildren={forceExpandedChildren}
          />
        )}
      </div>
    );
  }

  return (
    <div id={`comment-${comment.id}`} ref={commentRef}>
      <div>
        <CmmOverlay
          forecast={100 * userForecast}
          updateForecast={updateForecast}
          showForecastingUI={postData?.question?.type === QuestionType.Binary}
          onClickScrollLink={() => {
            cmmContext.setIsOverlayOpen(false);
            const section = document.getElementById("prediction-section");
            if (section) {
              section.scrollIntoView({ behavior: "smooth" });
            }
          }}
          cmmContext={cmmContext}
        />
        <div
          className={cn("flex flex-col items-start gap-1", {
            "mb-1": !isCollapsed,
          })}
        >
          <span className="inline-flex w-full flex-col items-start justify-start text-base sm:flex-row sm:items-center">
            <div
              className={cn("flex flex-row items-start", {
                "w-full": comment.is_pinned,
              })}
            >
              <div
                className={cn("flex sm:flex-row sm:items-center", {
                  "flex-col": !isCollapsed,
                  "items-center": isCollapsed,
                })}
              >
                <Link
                  className="flex flex-row items-center no-underline"
                  href={`/accounts/profile/${comment.author.id}/`}
                >
                  <h4 className="my-1 text-base">
                    {formatUsername(comment.author)}
                  </h4>
                  {comment.author_staff_permission ===
                    ProjectPermissions.CURATOR && (
                    <Moderator className="ml-2 text-lg" />
                  )}
                  {comment.author_staff_permission ===
                    ProjectPermissions.ADMIN && (
                    <Admin className="ml-2 text-lg" />
                  )}
                </Link>
                <span
                  className={cn("mx-1 opacity-55 sm:inline", {
                    hidden: !isCollapsed,
                  })}
                >
                  ·
                </span>
                <CommentDate comment={comment} />
              </div>
              {comment.is_pinned && (
                <div className="ml-auto mt-1 flex flex-row items-center gap-2 text-sm text-blue-500 dark:text-blue-500-dark">
                  <FontAwesomeIcon icon={faThumbtack} />
                  <span className="hidden lg:inline">{t("pinned")}</span>
                </div>
              )}
            </div>

            {isCollapsed && (
              <div className="flex w-full flex-1 flex-row items-center justify-between sm:ml-5 sm:w-auto">
                <div
                  className="mr-3 line-clamp-1 flex-grow sm:mr-0 sm:max-w-[350px]"
                  ref={ref}
                >
                  {!!width && (
                    <MarkdownEditor
                      mode="read"
                      markdown={getMarkdownSummary({
                        markdown: comment.text,
                        width,
                        height: 24,
                        charWidth: 8.1,
                      })}
                      contentEditableClassName="font-inter !text-gray-700 !dark:text-gray-700-dark *:m-0"
                      withUgcLinks
                      withCodeBlocks
                    />
                  )}
                </div>
                <FontAwesomeIcon
                  size="sm"
                  icon={faChevronDown}
                  className="ml-auto block text-blue-500 dark:text-blue-500-dark"
                />
              </div>
            )}
          </span>
          {/*
        <span className="text-gray-600 dark:text-gray-600-dark block text-xs leading-3">
          {comment.parent
            ? t("replied")
            : t(commentTypes[comment.submit_type]?.verb ?? "commented")}{" "}
          {commentAge(comment.created_time)}
        </span>
        */}
          {/* comment indexing is broken, since the comment feed loading happens async for the client*/}
          {comment.included_forecast && !isCollapsed && (
            <IncludedForecast
              author={formatUsername(comment.author)}
              forecast={comment.included_forecast}
            />
          )}
        </div>
        {/* TODO: fix TS error */}
        {/* {comment.parent && onProfile && (
        <div>
          <a
            href={`/questions/${comment.parent.on_post}/#comment-${comment.parent.id}`}
          >
            {t('inReplyTo', {author: comment.parent.author.username})}
          </a>
        </div>
      )} */}

        {!isCollapsed && (
          <>
            <div className="break-anywhere">
              {isEditing && (
                <MarkdownEditor
                  key={`edit-${comment.id}-${editorKey}`}
                  markdown={commentMarkdown}
                  mode="write"
                  onChange={(val) => {
                    setCommentMarkdown(val);
                    saveEditDraftDebounced(val);
                  }}
                  withUgcLinks
                  withCodeBlocks
                />
              )}{" "}
              {!isEditing && (
                <MarkdownEditor
                  markdown={parseUserMentions(
                    commentMarkdown,
                    comment.mentioned_users
                  )}
                  mode={"read"}
                  withUgcLinks
                  withTwitterPreview
                  withCodeBlocks
                />
              )}
            </div>
            {!!errorMessage && isEditing && (
              <FormErrorMessage
                errors={errorMessage}
                containerClassName="text-balance text-center text-red-500 dark:text-red-500-dark"
              />
            )}
            {isEditing && (
              <>
                <Button
                  onClick={handleSaveComment}
                  disabled={isLoading}
                  className={cn(isLoading && "h-8")}
                >
                  {isLoading ? (
                    <LoadingSpinner className="mx-2.5 size-3" />
                  ) : (
                    t("save")
                  )}
                </Button>
                <Button
                  className="ml-2"
                  onClick={() => {
                    setCommentMarkdown(tempCommentMarkdown);
                    setIsEditing(false);
                  }}
                  disabled={isLoading}
                >
                  {t("cancel")}
                </Button>
              </>
            )}

            {commentKeyFactors.length > 0 && canListKeyFactors && postData && (
              <KeyFactorsCommentSection
                post={postData}
                keyFactors={commentKeyFactors}
                permission={postData.user_permission}
                authorId={comment.author.id}
              />
            )}

            <div className="mb-2 mt-1 h-7 overflow-visible">
              <div className="flex items-center justify-between text-sm leading-4 text-gray-900 dark:text-gray-900-dark">
                <div className="inline-flex items-center gap-2.5">
                  <CommentVoter
                    voteData={{
                      commentAuthorId: comment.author.id,
                      commentId: comment.id,
                      voteScore: comment.vote_score,
                      userVote: comment.user_vote ?? null,
                    }}
                  />

                  {canAddKeyFactors && (
                    <Button
                      size="xxs"
                      variant="tertiary"
                      onClick={onAddKeyFactorClick}
                      className="relative flex items-center justify-center"
                    >
                      <>
                        <div
                          className={cn(
                            "absolute inset-0 flex items-center justify-center",
                            isLoadingSuggestedKeyFactors && "visible",
                            !isLoadingSuggestedKeyFactors && "invisible"
                          )}
                        >
                          <LoadingSpinner className="size-4" />
                        </div>
                        <div
                          className={cn(
                            "flex items-center",
                            isLoadingSuggestedKeyFactors && "invisible",
                            !isLoadingSuggestedKeyFactors && "visible"
                          )}
                        >
                          <FontAwesomeIcon
                            icon={isKeyfactorsFormOpen ? faXmark : faPlus}
                            className="size-4 p-1"
                          />
                          {t("addKeyFactor")}
                        </div>
                      </>
                    </Button>
                  )}

                  {isCmmButtonVisible && !isMobileScreen && (
                    <CmmToggleButton
                      cmmContext={cmmContext}
                      comment_id={comment.id}
                      disabled={isCmmButtonDisabled}
                      ref={cmmContext.setAnchorRef}
                    />
                  )}

                  {!onProfile &&
                    (isReplying ? (
                      <Button
                        size="xxs"
                        variant="tertiary"
                        onClick={() => {
                          setIsReplying(false);
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faXmark}
                          className="size-4 p-1"
                        />
                        {t("cancel")}
                      </Button>
                    ) : (
                      <Button
                        size="xxs"
                        onClick={() => setIsReplying(true)}
                        variant="tertiary"
                        className="gap-0.5"
                      >
                        <FontAwesomeIcon
                          icon={faReply}
                          className="size-4 p-1"
                          size="xs"
                        />
                        {t("reply")}
                      </Button>
                    ))}
                </div>

                <div
                  ref={isMobileScreen ? cmmContext.setAnchorRef : null}
                  className={cn(treeDepth > 0 && "pr-1.5 md:pr-2")}
                >
                  <DropdownMenu items={menuItems} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {isReplying && (
        <CommentEditor
          parentId={comment.id}
          postId={comment.on_post}
          replyUsername={comment.author.username}
          onSubmit={(newComment: CommentType) => {
            addNewChildrenComment(comment, newComment);
            setIsReplying(false);
          }}
          isReplying={isReplying}
        />
      )}
      {isKeyfactorsFormOpen && postData && (
        <CommentForm
          onSubmit={handleSubmit}
          onCancel={onCancel}
          cancelDisabled={isPending}
          submitDisabled={
            isPending ||
            (!drafts.some((k) => k.driver.text.trim() !== "") &&
              suggestedKeyFactors.length === 0) ||
            drafts.some(
              (obj) => !driverTextSchema.safeParse(obj.driver.text).success
            ) ||
            drafts.some(
              (d) =>
                d.driver.text.trim() !== "" &&
                d.driver.impact_direction === null &&
                d.driver.certainty !== -1
            )
          }
        >
          <AddKeyFactorsForm
            drafts={drafts}
            setDrafts={setDrafts}
            factorsLimit={factorsLimit}
            limitError={limitError}
            suggestedKeyFactors={suggestedKeyFactors}
            setSuggestedKeyFactors={setSuggestedKeyFactors}
            post={postData}
          />
          <p className="m-0">{t("addDriverCommentDisclaimer")}</p>
          <FormError errors={keyFactorsErrors} />
        </CommentForm>
      )}
      {isCommentJustCreated && postData && (
        <CoherenceLinksForm
          post={postData}
          comment={comment}
        ></CoherenceLinksForm>
      )}
      {comment.children?.length > 0 && !isCollapsed && (
        <CommentChildrenTree
          commentChildren={comment.children}
          expandedChildren={!onProfile && !comment.is_pinned}
          forceExpandedChildren={!onProfile && forceExpandedChildren}
          treeDepth={treeDepth + 1}
          sort={sort}
          postData={postData}
          lastViewedAt={lastViewedAt}
          shouldSuggestKeyFactors={shouldSuggestKeyFactors}
          isSomeChildrenUnread={isSomeChildrenUnread}
        />
      )}
      <CommentReportModal
        comment={comment}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

function addNewChildrenComment(comment: CommentType, newComment: CommentType) {
  if (comment.id === newComment.parent_id) {
    comment.children.push(newComment);
    return;
  }
  comment.children.map((nestedComment) => {
    addNewChildrenComment(nestedComment, newComment);
  });
}

function updateCommentKeyFactors(
  comment: CommentType,
  targetId: number,
  newKeyFactors: KeyFactor[]
): CommentType {
  if (comment.id === targetId) {
    return {
      ...comment,
      key_factors: newKeyFactors,
    };
  }

  if (comment.children && comment.children.length > 0) {
    return {
      ...comment,
      children: comment.children.map((child) =>
        updateCommentKeyFactors(child, targetId, newKeyFactors)
      ),
    };
  }

  return comment;
}

export default Comment;
