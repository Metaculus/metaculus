"use client";

import { faReply } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { FC, useState } from "react";

import { softDeleteComment, editComment } from "@/app/(main)/questions/actions";
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

type Props = {
  comment: CommentType;
  url: string;
  permissions: CommentPermissions;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

const Comment: FC<Props> = ({ comment, url, permissions }) => {
  const locale = useLocale();
  const t = useTranslations();
  const [commentMode, setCommentMode] = useState<"read" | "write">("read");
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
        setCommentMode("write");
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
      hidden: !user?.id,
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

        {/* comment children tree goes here */}
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

      {comment.parent && (
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
          mode={commentMode}
          onChange={(text) => {
            setCommentMarkdown(text);
          }}
        />
      </div>
      {commentMode === "write" && (
        <Button
          onClick={() => {
            setCommentMode("read");
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
            <Button variant="text">
              <FontAwesomeIcon icon={faReply} />
              {t("reply")}
            </Button>
          </div>

          <DropdownMenu items={menuItems} />
        </div>
      </div>

      {/*isReplying && (
        <form
          id={`reply-to-comment-${comment.parent ?? comment.id}`}
          onSubmit={handleSubmit(handleReply)}
        >
          <div ref={replyRef}>
            <TextAreaWithMentions
              ref={replyInputRef}
              value={getValues("comment_text")}
              data={tribute}
              onChange={({ target }) => {
                setValue("comment_text", target.value, {
                  shouldValidate: true,
                });
                // This fixes a bug where the focus jumps to the end
                // when writing somewhere in the middle of the textarea
                // TODO: Find a better way to fix this bug
                setHelper(target.value);
              }}
              autoFocus
            />
            {replyPreview && (
              <div
                className="comment__html bg-gray-200 dark:bg-gray-200-dark mt-3 p-2 font-serif text-base leading-tight break-anywhere dark:font-light"
                dangerouslySetInnerHTML={{ __html: replyPreview }}
              />
            )}
            <div className="my-2 flex items-center justify-end gap-2">
              <Button
                disabled={!isValid}
                onClick={getReplyPreview}
                type="button"
              >
                {t(replyPreview ? "updatePreviewButton" : "previewButton")}
              </Button>
              <Button
                variant="primary"
                disabled={!isValid || isSubmitting}
                type="submit"
              >
                {t("postButton")}
              </Button>
            </div>
          </div>
        </form>
      )*/}

      {/*Object.entries(errors).map(([key, error]) => (
        <p
          key={key}
          className="text-red-500 dark:text-red-500-dark my-1 text-sm leading-4"
        >
          {error.message}
        </p>
      ))*/}

      {/*
      {comment.children?.length > 0 && (
        <div className="relative ml-4 mt-3 pl-4" ref={childrenRef}>
          <Button
            variant="link"
            size="sm"
            className="w-full"
            onClick={toggleReplies}
          >
            <FontAwesomeIcon
              icon={icon({ name: "caret-right", style: "solid" })}
              className={clsx("inline-block transition-transform", {
                "rotate-90": childrenExpanded,
              })}
            />
            <span className="flex-1 text-left">
              {childrenExpanded ? t("hide") : t("show")}{" "}
              {t("replyWithCount", { count: comment.children.length })}
            </span>
          </Button>
          <div
            className="absolute inset-y-0 -left-2 w-4 cursor-pointer after:absolute after:inset-y-0 after:left-2 after:block after:w-px after:border-l after:border-gray-600 after:content-[''] after:dark:border-gray-600-dark"
            onClick={toggleReplies}
          />
          {childrenExpanded && (
            <div className="mt-0">
              {comment.children.map((child) => (
                <Comment key={child.id} comment={child} />
              ))}
            </div>
          )}
        </div>
      )}
      */}
    </div>
  );
};

export default Comment;
