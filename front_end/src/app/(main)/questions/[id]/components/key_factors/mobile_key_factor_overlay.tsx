"use client";

import {
  faArrowUpRightFromSquare,
  faChevronLeft,
  faChevronRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import { useLocale, useTranslations } from "next-intl";
import { FC, Fragment } from "react";

import CommentActionBar from "@/components/comment_feed/comment_action_bar";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import MarkdownEditor from "@/components/markdown_editor";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { BECommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { VoteDirection } from "@/types/votes";
import { parseUserMentions } from "@/utils/comments";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";

import { KeyFactorItem } from "./item_view";
import QuestionLinkKeyFactorItem from "./item_view/question_link/question_link_key_factor_item";

type Props = {
  keyFactor: KeyFactor | null;
  questionLink: FetchedAggregateCoherenceLink | null;
  post: PostWithForecasts;
  comment: BECommentType | null;
  binaryQuestion: QuestionWithNumericForecasts | null;
  relatedKeyFactors: KeyFactor[];
  allPostKeyFactors: KeyFactor[];
  currentIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  hasComment: boolean;
  onClose: () => void;
  onSelectKeyFactor?: (keyFactor: KeyFactor) => void;
  onScrollToComment: () => void;
  onVoteChange: (voteScore: number, userVote: VoteDirection | null) => void;
  onCmmToggle: (enabled: boolean) => void;
};

const MobileKeyFactorOverlay: FC<Props> = ({
  keyFactor,
  questionLink,
  post,
  comment,
  binaryQuestion,
  relatedKeyFactors,
  allPostKeyFactors,
  currentIndex,
  hasPrev,
  hasNext,
  hasComment,
  onClose,
  onSelectKeyFactor,
  onScrollToComment,
  onVoteChange,
  onCmmToggle,
}) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-[201]" onClose={onClose}>
        <div className="fixed inset-0 bg-white/90 backdrop-blur-[10px] dark:bg-gray-0-dark/90" />
        <div className="fixed inset-0 overflow-y-auto">
          <DialogPanel className="relative flex min-h-full flex-col px-4 pb-6 pt-4">
            {keyFactor && allPostKeyFactors.length > 1 && (
              <>
                <button
                  aria-label="Previous"
                  onClick={() => {
                    const prev = allPostKeyFactors[currentIndex - 1];
                    if (prev) onSelectKeyFactor?.(prev);
                  }}
                  className={cn(
                    "fixed left-1 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-xl text-blue-800 dark:text-blue-800-dark",
                    !hasPrev && "hidden"
                  )}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                <button
                  aria-label="Next"
                  onClick={() => {
                    const next = allPostKeyFactors[currentIndex + 1];
                    if (next) onSelectKeyFactor?.(next);
                  }}
                  className={cn(
                    "fixed right-1 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-xl text-blue-800 dark:text-blue-800-dark",
                    !hasNext && "hidden"
                  )}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </>
            )}

            <div className="mb-2 flex justify-end">
              <button
                aria-label={t("close")}
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-full border border-blue-400 bg-gray-0 text-sm text-blue-700 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-700-dark"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="mb-2 flex items-start gap-3 px-1">
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold leading-5 tracking-tight text-gray-800 dark:text-gray-800-dark">
                  {post.title}
                </h2>
              </div>
              {binaryQuestion && (
                <BinaryCPBar
                  question={binaryQuestion}
                  size="sm"
                  className="shrink-0"
                />
              )}
            </div>

            <span className="mb-2 text-center text-sm font-medium leading-5 text-gray-1000/50 dark:text-gray-1000-dark/50">
              {t("keyFactor")}
            </span>

            <div className="relative my-4 flex items-center justify-center py-3">
              {hasPrev &&
                (() => {
                  const prevKf = allPostKeyFactors[currentIndex - 1];
                  return prevKf ? (
                    <div className="pointer-events-none absolute bottom-3 left-0 top-3 w-5 overflow-hidden rounded-r-xl">
                      <div className="absolute right-0 h-full w-[280px]">
                        <KeyFactorItem
                          keyFactor={prevKf}
                          linkToComment={false}
                          projectPermission={post.user_permission}
                        />
                      </div>
                    </div>
                  ) : null;
                })()}
              <div className="w-[68%] origin-center scale-[1.25]">
                {questionLink ? (
                  <QuestionLinkKeyFactorItem
                    link={questionLink}
                    post={post}
                    linkToComment={false}
                  />
                ) : (
                  keyFactor && (
                    <KeyFactorItem
                      keyFactor={keyFactor}
                      linkToComment={false}
                      projectPermission={post.user_permission}
                    />
                  )
                )}
              </div>
              {hasNext &&
                (() => {
                  const nextKf = allPostKeyFactors[currentIndex + 1];
                  return nextKf ? (
                    <div className="pointer-events-none absolute bottom-3 right-0 top-3 w-5 overflow-hidden rounded-l-xl">
                      <div className="h-full w-[280px]">
                        <KeyFactorItem
                          keyFactor={nextKf}
                          linkToComment={false}
                          projectPermission={post.user_permission}
                        />
                      </div>
                    </div>
                  ) : null;
                })()}
            </div>

            {keyFactor && hasComment && (
              <>
                <span className="mb-2 text-center text-sm font-medium leading-5 text-gray-1000/50 dark:text-gray-1000-dark/50">
                  {t("comment")}
                </span>

                <div className="mb-3 overflow-hidden rounded-xl bg-blue-200 px-5 py-4 dark:bg-blue-200-dark">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-base font-bold leading-6 text-gray-800 dark:text-gray-800-dark">
                      {keyFactor.author.username}
                    </span>
                    <span className="size-[2px] shrink-0 rounded-full bg-gray-500 dark:bg-gray-500-dark" />
                    <span
                      className="flex-1 text-base leading-6 text-gray-500 dark:text-gray-500-dark"
                      suppressHydrationWarning
                    >
                      {t("onDate", {
                        date: formatDate(
                          locale,
                          new Date(keyFactor.created_at)
                        ),
                      })}
                    </span>
                    <button
                      onClick={onScrollToComment}
                      className="shrink-0 text-base text-blue-600 dark:text-blue-600-dark"
                      aria-label={t("viewComment")}
                    >
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                    </button>
                  </div>

                  <div className="text-base leading-6 text-gray-700 dark:text-gray-700-dark">
                    {!comment && (
                      <div className="animate-pulse space-y-[10px]">
                        <div className="h-[1.5em] rounded bg-gray-300 dark:bg-gray-300-dark" />
                        <div className="h-[1.5em] rounded bg-gray-300 dark:bg-gray-300-dark" />
                        <div className="h-[1.5em] w-4/5 rounded bg-gray-300 dark:bg-gray-300-dark" />
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
                    <div className="mt-3.5 flex flex-col gap-3">
                      <span className="text-[10px] font-medium uppercase leading-3 text-gray-500 dark:text-gray-500-dark">
                        {t("keyFactors")}
                      </span>
                      <div className="flex gap-2.5 overflow-x-auto">
                        {relatedKeyFactors.map((kf) => (
                          <KeyFactorItem
                            key={kf.id}
                            keyFactor={kf}
                            isCompact
                            projectPermission={post.user_permission}
                            className="w-[160px] shrink-0"
                            onClick={() => onSelectKeyFactor?.(kf)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {!comment && (
                  <div className="flex animate-pulse items-center gap-3 text-sm leading-4">
                    <div className="inline-flex items-center gap-2 rounded-sm border border-blue-500/30 px-1 dark:border-blue-600/30">
                      <div className="size-6 rounded-sm bg-gray-200 dark:bg-gray-200-dark" />
                      <div className="h-3 w-4 rounded bg-gray-200 dark:bg-gray-200-dark" />
                      <div className="size-6 rounded-sm bg-gray-200 dark:bg-gray-200-dark" />
                    </div>
                  </div>
                )}
                {comment && (
                  <CommentActionBar
                    comment={comment}
                    post={post}
                    onReply={onScrollToComment}
                    onScrollToLink={onScrollToComment}
                    onVoteChange={onVoteChange}
                    onCmmToggle={onCmmToggle}
                  />
                )}
              </>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MobileKeyFactorOverlay;
