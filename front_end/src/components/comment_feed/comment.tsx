"use client";

import {
  faXmark,
  faChevronRight,
  faReply,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState, useEffect } from "react";

import {
  softDeleteComment,
  editComment,
  createForecasts,
} from "@/app/(main)/questions/actions";
import CommentEditor from "@/components/comment_feed/comment_editor";
import CommentReportModal from "@/components/comment_feed/comment_report_modal";
import CommentVoter from "@/components/comment_feed/comment_voter";
import MarkdownEditor from "@/components/markdown_editor";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { CommentPermissions, CommentType } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { QuestionType } from "@/types/question";
import { parseUserMentions } from "@/utils/comments";
import { formatDate } from "@/utils/date_formatters";
import { canPredictQuestion } from "@/utils/questions";

import { CmmOverlay, CmmToggleButton, useCmmContext } from "./comment_cmm";
import IncludedForecast from "./included_forecast";

import { SortOption, sortComments } from ".";

type CommentChildrenTreeProps = {
  commentChildren: CommentType[];
  permissions: CommentPermissions;
  expandedChildren?: boolean;
  treeDepth: number;
  sort: SortOption;
};

const CommentChildrenTree: FC<CommentChildrenTreeProps> = ({
  commentChildren,
  permissions,
  expandedChildren = false,
  treeDepth,
  sort,
}) => {
  const t = useTranslations();
  const [childrenExpanded, setChildrenExpanded] = useState(
    expandedChildren && treeDepth < 5
  );

  useEffect(() => {
    sortComments(commentChildren, sort);
  }, [commentChildren, sort]);

  function getTreeSize(commentChildren: CommentType[]): number {
    let totalChildren = 0;
    commentChildren.forEach((comment) => {
      if (comment.children.length === 0) {
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
      <Button
        variant="link"
        size="sm"
        className="mt-2 w-full"
        onClick={() => {
          setChildrenExpanded(!childrenExpanded);
        }}
      >
        <FontAwesomeIcon
          icon={faChevronRight}
          className={classNames("inline-block transition-transform", {
            "-rotate-90": childrenExpanded,
          })}
        />
        <span className="flex-1 text-left">
          {childrenExpanded
            ? t("hideReplyWithCount", { count: getTreeSize(commentChildren) })
            : t("showReplyWithCount", { count: getTreeSize(commentChildren) })}
        </span>
      </Button>
      <div
        className={classNames("relative", treeDepth < 5 ? "mt-3 pl-4" : null)}
      >
        {treeDepth < 5 && (
          <div
            className="absolute inset-y-0 -left-2 w-4 cursor-pointer after:absolute after:inset-y-0 after:left-2 after:block after:w-px after:border-l after:border-gray-600 after:content-[''] after:hover:border-gray-800 after:dark:border-gray-600-dark after:hover:dark:border-gray-800-dark"
            onClick={() => {
              setChildrenExpanded(!childrenExpanded);
            }}
          />
        )}
        {childrenExpanded &&
          commentChildren.map((child: CommentType) => (
            <div key={child.id}>
              <hr className="my-4" />
              <Comment
                comment={child}
                permissions={permissions}
                treeDepth={treeDepth}
                sort={sort}
              />
            </div>
          ))}
      </div>
    </>
  );
};

type CommentProps = {
  comment: CommentType;
  permissions: CommentPermissions;
  onProfile?: boolean;
  treeDepth: number;
  sort: SortOption;
  postData?: PostWithForecasts;
  lastViewedAt?: string;
};

const Comment: FC<CommentProps> = ({
  comment,
  permissions,
  onProfile = false,
  treeDepth,
  sort,
  postData,
  lastViewedAt,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleted, setIsDeleted] = useState(comment.is_soft_deleted);
  const [isReplying, setIsReplying] = useState(false);
  const [commentMarkdown, setCommentMarkdown] = useState(
    parseUserMentions(comment.text, comment.mentioned_users)
  );
  const [tempCommentMarkdown, setTempCommentMarkdown] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { user } = useAuth();
  if (user?.id === comment.author.id) {
    permissions = CommentPermissions.CREATOR;
  }

  const userCanPredict = postData && canPredictQuestion(postData);
  const userForecast =
    postData?.question?.my_forecasts?.latest?.forecast_values[1] ?? 0.5;

  const isCmmButtonVisible =
    user?.id !== comment.author.id && !!postData?.question;
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

    if (response && "errors" in response && !!response.errors) {
      throw response.errors;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error(t("failedToCopyText"), err);
    }
  };

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
      hidden:
        permissions !== CommentPermissions.CREATOR &&
        permissions !== CommentPermissions.CURATOR,
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
        copyToClipboard(`${window.location.href}#comment-${comment.id}`);
      },
    },
    {
      hidden: !user?.id,
      id: "report",
      name: t("report"),
      onClick: () => setIsReportModalOpen(true),
    },
    {
      hidden: permissions !== CommentPermissions.CURATOR,
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
  ];

  if (isDeleted) {
    return (
      <div id={`comment-${comment.id}`}>
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
            {formatDate(locale, new Date(comment.created_at))}
          </span>
        </div>
        <div className="italic text-gray-600 break-anywhere dark:text-gray-600-dark">
          {t("commentDeleted")}
        </div>

        {comment.children.length > 0 && (
          <CommentChildrenTree
            commentChildren={comment.children}
            permissions={permissions}
            treeDepth={treeDepth + 1}
            sort={sort}
          />
        )}
      </div>
    );
  }

  return (
    <div id={`comment-${comment.id}`}>
      <div
        className={classNames("p-2", {
          "bg-blue-100 dark:bg-blue-100-dark":
            lastViewedAt &&
            new Date(lastViewedAt) < new Date(comment.created_at),
        })}
      >
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

        {/* comment indexing is broken, since the comment feed loading happens async for the client*/}
        {comment.included_forecast && (
          <IncludedForecast
            author={comment.author.username}
            forecast={comment.included_forecast}
          />
        )}
        <div className="my-2.5 flex flex-col items-start gap-1">
          <span className="inline-flex items-center">
            <a
              className="no-underline"
              href={`/accounts/profile/${comment.author.id}/`}
            >
              <h4 className="my-1">{comment.author.username}</h4>
            </a>
            {/*
          {comment.is_moderator && !comment.is_admin && (
            <Moderator className="ml-2 text-lg" />
          )}
          {comment.is_admin && <Admin className="ml-2 text-lg" />}
          */}
            <span className="mx-1">·</span>
            {formatDate(locale, new Date(comment.created_at))}
          </span>
          {/*
        <span className="text-gray-600 dark:text-gray-600-dark block text-xs leading-3">
          {comment.parent
            ? t("replied")
            : t(commentTypes[comment.submit_type]?.verb ?? "commented")}{" "}
          {commentAge(comment.created_time)}
        </span>
        */}
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
            />
          )}{" "}
          {!isEditing && (
            <MarkdownEditor markdown={commentMarkdown} mode={"read"} />
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
            <div className="inline-flex items-center gap-3">
              <CommentVoter
                voteData={{
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
                    className="ml-auto p-2"
                    variant="text"
                    onClick={() => {
                      setIsReplying(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                    {t("cancel")}
                  </Button>
                ) : (
                  <Button onClick={() => setIsReplying(true)} variant="text">
                    <FontAwesomeIcon icon={faReply} />
                    {t("reply")}
                  </Button>
                ))}
            </div>

            <div ref={isMobileScreen ? cmmContext.setAnchorRef : null}>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </div>
      {isReplying && (
        <CommentEditor
          parentId={comment.id}
          postId={comment.on_post}
          onSubmit={(newComment: CommentType) => {
            addNewChildrenComment(comment, newComment);
            setIsReplying(false);
          }}
          isReplying={isReplying}
        />
      )}

      {comment.children.length > 0 && (
        <CommentChildrenTree
          commentChildren={comment.children}
          permissions={permissions}
          expandedChildren={!onProfile}
          treeDepth={treeDepth + 1}
          sort={sort}
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
