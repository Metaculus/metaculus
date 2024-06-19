"use client";
import { faReply } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useLocale } from "next-intl";
import { FC } from "react";

import Button from "@/components/ui/button";
import DropdownMenu from "@/components/ui/dropdown_menu";
import { CommentType } from "@/types/comment";
import { formatDate } from "@/utils/date_formatters";

type Props = {
  comment: CommentType;
  url: string;
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};

const Comment: FC<Props> = ({ comment, url }) => {
  const locale = useLocale();

  const menuItems = [
    {
      //show: canEdit && !(isEditing || isReplying),
      id: "edit",
      name: "Edit [TODO]",
      onClick: () => {}, //openEditing,
    },
    {
      //show: true,
      id: "copyLink",
      name: "Copy Link",
      onClick: () => {
        copyToClipboard(`${url}#comment-${comment.id}`);
      },
    },
    {
      //show: user.isAuthenticated,
      id: "report",
      name: "Report [TODO]",
      onClick: () => {
        return null; //setReportModalOpen(true)
      },
    },
    {
      //show: canDelete,
      id: "delete",
      name: "Delete [TODO]",
      onClick: () => {
        return null; // setDeleteModalOpen(true),
      },
    },
  ];

  return (
    <div id={`comment-${comment.id}`}>
      <div className="my-2.5 flex flex-col items-start gap-1">
        <span className="inline-flex items-center">
          <a
            className="no-underline"
            href={`/accounts/profile/${comment.author.id}/`}
          >
            <h4 className="my-0">
              {/*comment.is_deactivated
                ? "[DEACTIVATED USER]"
                : .author_name*/}
              {comment.author.username}
              {/*
              {comment.author_forecaster_type === "BOT" && (
                <span className="ml-1">🤖</span>
              )}
              */}
            </h4>
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
          <a href={`#comment-${comment.parent}`}>➞ in reply to: USERNAME</a>
        </div>
      )}
      <div className="break-anywhere">{comment.text}</div>
      {/*
      {isEditing && (
        <div className="mx-auto my-3" ref={editRef}>
          <TextAreaWithMentions
            value={editText}
            data={tribute}
            onChange={({ target }) => setEditText(target.value)}
            autoFocus
          />
          {editPreview && (
            <div
              className="comment__html bg-gray-200 dark:bg-gray-200-dark mt-3 p-2 font-serif text-base leading-tight break-anywhere dark:font-light"
              dangerouslySetInnerHTML={{ __html: editPreview }}
            />
          )}
          <div className="my-2 flex items-center justify-end gap-2">
            {user.permissions["metac_question.delete_comment"] && (
              <Button
                variant="secondary"
                href={`/admin/metac_question/comment/${comment.id}/`}
              >
                {t("adminEditButton")}
              </Button>
            )}
            <Button disabled={!editText.trim()} onClick={getEditPreview}>
              {editPreview ? t("updatePreviewButton") : t("previewButton")}
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onEdit({ ...comment, comment_text: editText })
                  .then(endEditing)
                  .catch((error) => catchError({ comment_text: `${error}` }));
              }}
              disabled={!editText.trim()}
            >
              {t("postButton")}
            </Button>
          </div>
        </div>
      )}
*/}

      {!comment.is_soft_deleted && (
        <div className="mb-2 mt-1 h-7 overflow-visible">
          <div className="flex items-center justify-between text-sm leading-4 text-gray-900 dark:text-gray-900-dark">
            <div className="inline-flex items-center">
              {/*
              <span className="mr-3 inline-flex items-center text-sm leading-4">
                <Voter
                  onVoteUp={() => onVote(comment, 1).catch(catchError)}
                  disabled={user.id === comment.author}
                  userVote={comment.user_like}
                  votes={comment.num_likes}
                />
              </span>
*/}
              <Button variant="text">
                <FontAwesomeIcon icon={faReply} />
                Reply
              </Button>
            </div>

            {!comment.is_soft_deleted && <DropdownMenu items={menuItems} />}
          </div>
        </div>
      )}

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
