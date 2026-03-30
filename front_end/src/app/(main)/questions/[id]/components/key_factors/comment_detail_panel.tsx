"use client";

import { useLocale, useTranslations } from "next-intl";
import { FC } from "react";

import CommentActionBar from "@/components/comment_feed/comment_action_bar";
import MarkdownEditor from "@/components/markdown_editor";
import { BECommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { VoteDirection } from "@/types/votes";
import { parseUserMentions } from "@/utils/comments";
import { formatDate } from "@/utils/formatters/date";

import { KeyFactorItem } from "./item_view";

type Props = {
  keyFactor: KeyFactor;
  relatedKeyFactors: KeyFactor[];
  post: PostWithForecasts;
  comment: BECommentType | null;
  isLoading: boolean;
  onScrollToComment: () => void;
  onReplyToComment: () => void;
  onSelectKeyFactor: (keyFactor: KeyFactor) => void;
  onVoteChange: (voteScore: number, userVote: VoteDirection | null) => void;
  onCmmToggle: (enabled: boolean) => void;
};

const CommentDetailPanel: FC<Props> = ({
  keyFactor,
  relatedKeyFactors,
  post,
  comment,
  isLoading,
  onScrollToComment,
  onReplyToComment,
  onSelectKeyFactor,
  onVoteChange,
  onCmmToggle,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div
      className="relative min-w-0 flex-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex max-h-[50dvh] flex-col gap-3.5 overflow-hidden rounded-xl bg-gray-0 p-5 shadow-2xl dark:bg-gray-0-dark lg:max-h-[calc(100dvh-10rem)]">
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-base font-bold text-gray-800 dark:text-gray-800-dark">
            {keyFactor.author.username}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-[2px] shrink-0 rounded-full bg-gray-500 dark:bg-gray-500-dark" />
            <span
              className="text-base text-gray-500 dark:text-gray-500-dark"
              suppressHydrationWarning
            >
              {t("onDate", {
                date: formatDate(locale, new Date(keyFactor.created_at)),
              })}
            </span>
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto text-base leading-6 text-gray-700 dark:text-gray-700-dark">
          {isLoading && (
            <div className="animate-pulse space-y-[10px]">
              <div className="h-[1.5em] rounded bg-gray-200 dark:bg-gray-700-dark" />
              <div className="h-[1.5em] rounded bg-gray-200 dark:bg-gray-700-dark" />
              <div className="h-[1.5em] w-4/5 rounded bg-gray-200 dark:bg-gray-700-dark" />
              <div className="h-[1.5em] w-1/2 rounded bg-gray-200 dark:bg-gray-700-dark" />
            </div>
          )}
          {comment && (
            <MarkdownEditor
              mode="read"
              markdown={parseUserMentions(
                comment.text,
                comment.mentioned_users
              )}
              contentEditableClassName="!text-base !leading-6 !text-gray-700 dark:!text-gray-700-dark"
              withUgcLinks
              withCodeBlocks
            />
          )}
        </div>

        {relatedKeyFactors.length > 0 && (
          <div className="flex shrink-0 flex-col gap-2">
            <span className="text-[10px] font-medium uppercase leading-3 text-gray-500 dark:text-gray-500-dark">
              {t("keyFactors")}
            </span>
            <div className="flex gap-1">
              {relatedKeyFactors.map((kf) => (
                <KeyFactorItem
                  key={kf.id}
                  keyFactor={kf}
                  linkToComment={false}
                  isCompact
                  projectPermission={post.user_permission}
                  className="w-[190px]"
                  onClick={() => onSelectKeyFactor(kf)}
                />
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex shrink-0 animate-pulse items-center gap-3 text-sm leading-4">
            <div className="inline-flex items-center gap-2 rounded-sm border border-blue-500/30 px-1 dark:border-blue-600/30">
              <div className="size-6 rounded-sm bg-gray-200 dark:bg-gray-700-dark" />
              <div className="h-3 w-4 rounded bg-gray-200 dark:bg-gray-700-dark" />
              <div className="size-6 rounded-sm bg-gray-200 dark:bg-gray-700-dark" />
            </div>
            <div className="inline-flex items-center gap-0.5 rounded-sm border border-blue-400/30 py-0 pl-0.5 pr-2 dark:border-blue-600/30">
              <div className="size-4 rounded-sm bg-gray-200 dark:bg-gray-700-dark" />
              <div className="h-3 w-9 rounded bg-gray-200 dark:bg-gray-700-dark" />
            </div>
            <div className="inline-flex items-center gap-1 rounded-sm border border-blue-400/30 px-2 py-1 dark:border-blue-600/30">
              <div className="size-4 rounded-full bg-gray-200 dark:bg-gray-700-dark" />
              <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-700-dark" />
            </div>
          </div>
        )}
        {comment && (
          <CommentActionBar
            comment={comment}
            post={post}
            onReply={onReplyToComment}
            onScrollToLink={onScrollToComment}
            onVoteChange={onVoteChange}
            onCmmToggle={onCmmToggle}
          />
        )}
      </div>
    </div>
  );
};

export default CommentDetailPanel;
