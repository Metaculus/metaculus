"use client";

import {
  faXmark,
  faChevronDown,
  faReply,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { FC, useState, useEffect, useRef } from "react";

import { softDeleteUserAction } from "@/app/(main)/accounts/profile/actions";
import {
  softDeleteComment,
  editComment,
  createForecasts,
  getComments,
} from "@/app/(main)/questions/actions";
import { CommentDate } from "@/components/comment_feed/comment_date";
import CommentEditor from "@/components/comment_feed/comment_editor";
import KeyFactor from "@/components/comment_feed/comment_key_factor";
import CommentReportModal from "@/components/comment_feed/comment_report_modal";
import CommentVoter from "@/components/comment_feed/comment_voter";
import { Admin } from "@/components/icons/admin";
import { Moderator } from "@/components/icons/moderator";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import useScrollTo from "@/hooks/use_scroll_to";
import { CommentType } from "@/types/comment";
import { PostWithForecasts, ProjectPermissions } from "@/types/post";
import { QuestionType } from "@/types/question";
import cn from "@/utils/cn";
import { parseUserMentions } from "@/utils/comments";
import { logError } from "@/utils/errors";
import { canPredictQuestion } from "@/utils/questions";

import { CmmOverlay, CmmToggleButton, useCmmContext } from "./comment_cmm";
import IncludedForecast from "./included_forecast";

import { SortOption, sortComments } from ".";

type CommentChildrenTreeProps = {
  commentChildren: CommentType[];
  expandedChildren?: boolean;
  treeDepth: number;
  sort: SortOption;
  postData?: PostWithForecasts;
  lastViewedAt?: string;
};

const CommentChildrenTree: FC<CommentChildrenTreeProps> = ({
  commentChildren,
  expandedChildren = false,
  treeDepth,
  sort,
  postData,
  lastViewedAt,
}) => {
  const t = useTranslations();
  const sortedCommentChildren = sortComments([...commentChildren], sort);
  const [childrenExpanded, setChildrenExpanded] = useState(
    expandedChildren && treeDepth < 5
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
                  "my-1 rounded-l-md border py-1 pl-1.5 md:py-1.5 md:pl-2.5",
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
  onProfile?: boolean;
  treeDepth: number;
  sort: SortOption;
  postData?: PostWithForecasts;
  lastViewedAt?: string;
};

const Comment: FC<CommentProps> = ({
  comment,
  onProfile = false,
  treeDepth,
  sort,
  postData,
  lastViewedAt,
}) => {
  const t = useTranslations();
  const commentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleted, setIsDeleted] = useState(comment.is_soft_deleted);
  const [isReplying, setIsReplying] = useState(false);
  const [commentMarkdown, setCommentMarkdown] = useState(comment.text);
  const [tempCommentMarkdown, setTempCommentMarkdown] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { user } = useAuth();
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

  const cmmContext = useCmmContext(
    comment.changed_my_mind.count,
    comment.changed_my_mind.for_this_user
  );

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
    sendGAEvent("event", "commentChangedPrediction");
    if (response && "errors" in response && !!response.errors) {
      throw response.errors;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      logError(err, `${t("failedToCopyText")} ${err}`);
    }
  };

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
      onClick: () => {
        setTempCommentMarkdown(commentMarkdown);
        setIsEditing(true);
      },
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
          />
        )}
      </div>
    );
  }

  return (
    <div id={`comment-${comment.id}`} ref={commentRef}>
      {comment.key_factors &&
        comment.key_factors.map((kf) => (
          <KeyFactor keyFactor={kf} key={`key-factor-${kf.id}`} />
        ))}
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
        <div className="mb-1 flex flex-col items-start gap-1">
          <span className="inline-flex items-center text-base">
            <a
              className="flex flex-row items-center no-underline"
              href={`/accounts/profile/${comment.author.id}/`}
            >
              <h4 className="my-1 text-base">
                {comment.author.username}
                {comment.author.is_bot && " 🤖"}
              </h4>
              {comment.author_staff_permission ===
                ProjectPermissions.CURATOR && (
                <Moderator className="ml-2 text-lg" />
              )}
              {comment.author_staff_permission === ProjectPermissions.ADMIN && (
                <Admin className="ml-2 text-lg" />
              )}
            </a>
            <span className="mx-1 opacity-55">·</span>
            <CommentDate comment={comment} />
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
          {comment.included_forecast && (
            <IncludedForecast
              author={comment.author.username}
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
        <div className="break-anywhere">
          {isEditing && (
            <MarkdownEditor
              markdown={commentMarkdown}
              mode={"write"}
              onChange={setCommentMarkdown}
              withUgcLinks
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
            />
          )}
        </div>
        {isEditing && (
          <>
            <Button
              onClick={async () => {
                const response = await editComment({
                  id: comment.id,
                  text: commentMarkdown,
                  author: user!.id,
                });
                if (response && "errors" in response) {
                  console.error(t("errorDeletingComment"), response.errors);
                } else {
                  // TODO: remove once comment edit BE data include mentioned_users
                  const newCommentDataResponse = await getComments({
                    focus_comment_id: String(comment.id),
                    sort: "-created_at",
                  });
                  if (
                    newCommentDataResponse &&
                    "errors" in newCommentDataResponse
                  ) {
                    console.error(
                      t("errorDeletingComment"),
                      newCommentDataResponse.errors
                    );
                  } else {
                    const newCommentData = newCommentDataResponse.results.find(
                      (q) => q.id === comment.id
                    );
                    setCommentMarkdown(commentMarkdown);
                  }
                  setIsEditing(false);
                }
              }}
            >
              {t("save")}
            </Button>
            <Button
              className="ml-2"
              onClick={() => {
                setCommentMarkdown(tempCommentMarkdown);
                setIsEditing(false);
              }}
            >
              {t("cancel")}
            </Button>
          </>
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
                    <FontAwesomeIcon icon={faXmark} className="size-4 p-1" />
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
      {comment.children?.length > 0 && (
        <CommentChildrenTree
          commentChildren={comment.children}
          expandedChildren={!onProfile}
          treeDepth={treeDepth + 1}
          sort={sort}
          postData={postData}
          lastViewedAt={lastViewedAt}
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

export default Comment;
