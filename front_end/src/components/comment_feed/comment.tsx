"use client";

import { faChevronRight, faReply } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState } from "react";

import { softDeleteComment, editComment } from "@/app/(main)/questions/actions";
import CommentEditor from "@/components/comment_feed/comment_editor";
import CommentVoter from "@/components/comment_feed/comment_voter";
import Button from "@/components/ui/button";
import DropdownMenu, { MenuItemProps } from "@/components/ui/dropdown_menu";
import { useAuth } from "@/contexts/auth_context";
import { CommentPermissions, CommentType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";

import IncludedForecast from "./included_forecast";

const MarkdownEditor = dynamic(() => import("@/components/markdown_editor"), {
  ssr: false,
});

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

type CommentChildrenTreeProps = {
  commentChildren: CommentType[];
  url: string;
  permissions: CommentPermissions;
  expandedChildren?: boolean;
  treeDepth: number;
};

const CommentChildrenTree: FC<CommentChildrenTreeProps> = ({
  commentChildren,
  url,
  permissions,
  expandedChildren = false,
  treeDepth,
}) => {
  const t = useTranslations();
  const [childrenExpanded, setChildrenExpanded] = useState(
    expandedChildren && treeDepth < 5
  );

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
          {/* TODO change these translation strings to be one cohesive string */}
          {childrenExpanded ? t("hide") : t("show")}{" "}
          {t("replyWithCount", { count: commentChildren.length })}
        </span>
      </Button>
      <div
        className={classNames("relative", treeDepth < 5 ? "mt-3 pl-4" : null)}
      >
        {treeDepth < 5 && (
          <div
            className="absolute inset-y-0 -left-2 w-4 cursor-pointer after:absolute after:inset-y-0 after:left-2 after:block after:w-px after:border-l after:border-gray-600 after:content-[''] after:dark:border-gray-600-dark"
            onClick={() => {
              setChildrenExpanded(!childrenExpanded);
            }}
          />
        )}
        {childrenExpanded &&
          commentChildren.map((child: CommentType) => (
            <Comment
              key={child.id}
              comment={child}
              url={url}
              permissions={permissions}
              treeDepth={treeDepth}
            />
          ))}
      </div>
    </>
  );
};

type CommentProps = {
  comment: CommentType;
  url: string;
  permissions: CommentPermissions;
  onProfile?: boolean;
  treeDepth: number;
};

const Comment: FC<CommentProps> = ({
  comment,
  url,
  permissions,
  onProfile = false,
  treeDepth,
}) => {
  const locale = useLocale();
  const t = useTranslations();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [commentMarkdown, setCommentMarkdown] = useState(comment.text);

  const { user } = useAuth();
  if (user?.id === comment.author.id) {
    permissions = CommentPermissions.CREATOR;
  }

  const menuItems: MenuItemProps[] = [
    {
      // hidden:
      //     permissions !== CommentPermissions.CREATOR &&
      //     permissions !== CommentPermissions.CURATOR,
      id: "edit",
      name: t("edit"),
      onClick: () => {
        setIsEditing(true);
      },
    },
    {
      id: "copyLink",
      name: t("copyLink"),
      onClick: () => {
        copyToClipboard(`${url}#comment-${comment.id}`);
      },
    },
    {
      //hidden: !user?.id,
      id: "report",
      name: t("report"),
      onClick: () => {
        return null; //setReportModalOpen(true)
      },
    },
    {
      // hidden: permissions !== CommentPermissions.CURATOR,
      id: "delete",
      name: t("delete"),
      onClick: async () => {
        // setDeleteModalOpen(true),
        softDeleteComment(comment.id);
      },
    },
  ];

  if (comment.is_soft_deleted) {
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
            url={url}
            permissions={permissions}
            treeDepth={treeDepth + 1}
          />
        )}
      </div>
    );
  }

  return (
    <div id={`comment-${comment.id}`}>
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

      {comment.parent && onProfile && (
        <div>
          <a
            href={`/questions/${comment.parent.on_post}/#comment-${comment.parent.id}`}
          >
            ➞ {t("inReplyTo")} {comment.parent.author.username}
          </a>
        </div>
      )}
      <div className="break-anywhere">
        <MarkdownEditor
          markdown={commentMarkdown}
          mode={isEditing ? "write" : "read"}
          onChange={(text) => {
            setCommentMarkdown(text);
          }}
        />
      </div>
      {isEditing && (
        <Button
          onClick={() => {
            setIsEditing(false);
            editComment({
              id: comment.id,
              text: commentMarkdown,
              author: user!.id,
            });
          }}
        >
          {t("save")}
        </Button>
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
            {!onProfile && (
              <Button onClick={() => setIsReplying(true)} variant="text">
                <FontAwesomeIcon icon={faReply} />
                {t("reply")}
              </Button>
            )}
          </div>

          <DropdownMenu items={menuItems} />
        </div>
      </div>

      {isReplying && (
        <CommentEditor parentId={comment.id} postId={comment.on_post} />
      )}

      {comment.children.length > 0 && (
        <CommentChildrenTree
          commentChildren={comment.children}
          url={url}
          permissions={permissions}
          expandedChildren={!onProfile}
          treeDepth={treeDepth + 1}
        />
      )}
    </div>
  );
};

export default Comment;
