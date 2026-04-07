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
import { FC, Fragment, useCallback, useRef } from "react";

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
import { isNewsKF } from "@/utils/key_factors";

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

// Each slide takes 68% of the container width, separated by 12px flex gap
const SLIDE_WIDTH_PERCENT = 68;
const SLIDE_GAP_PX = 12;

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
  const trackRef = useRef<HTMLDivElement>(null);

  // Calculate translateX so that currentIndex is centered.
  // Each slide occupies SLIDE_WIDTH_PERCENT% of the container + gap.
  // We offset by -currentIndex * (slideWidth + gap) then add half container
  // minus half slide to center it.
  const getTranslateX = useCallback(() => {
    const container = trackRef.current?.parentElement;
    if (!container) {
      // Fallback: pure percentage-based calculation
      return `calc(${50 - SLIDE_WIDTH_PERCENT / 2 - currentIndex * SLIDE_WIDTH_PERCENT}% - ${currentIndex * SLIDE_GAP_PX}px)`;
    }
    const containerWidth = container.offsetWidth;
    const slideWidth = (containerWidth * SLIDE_WIDTH_PERCENT) / 100;
    const offset =
      -currentIndex * (slideWidth + SLIDE_GAP_PX) +
      (containerWidth - slideWidth) / 2;
    return `${offset}px`;
  }, [currentIndex]);

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-[201]" onClose={onClose}>
        <div className="fixed inset-0 bg-white/90 backdrop-blur-[10px] dark:bg-gray-0-dark/90" />
        <div className="fixed inset-0 overflow-y-auto overscroll-y-contain">
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

            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="mt-0 text-base font-semibold leading-5 tracking-tight text-gray-800 dark:text-gray-800-dark">
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

            <span className="mt-2 text-center text-sm font-medium leading-5 text-gray-1000/50 dark:text-gray-1000-dark/50">
              {t("keyFactor")}
            </span>

            {allPostKeyFactors.length > 1 ? (
              <div className="-mx-4 my-1 overflow-hidden py-1">
                <div
                  ref={trackRef}
                  className="flex gap-3 transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${getTranslateX()})` }}
                >
                  {allPostKeyFactors.map((kf, idx) => {
                    const isCurrent = idx === currentIndex;
                    return (
                      <div
                        key={kf.id}
                        className={cn(
                          "relative w-[68%] shrink-0",
                          !isCurrent && "pointer-events-none"
                        )}
                      >
                        <KeyFactorItem
                          keyFactor={kf}
                          linkToComment={false}
                          projectPermission={post.user_permission}
                        />
                        {!isCurrent && (
                          <button
                            className="pointer-events-auto absolute inset-0 z-10"
                            aria-label={t("scrollToKeyFactor")}
                            onClick={() => onSelectKeyFactor?.(kf)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="my-4 flex items-center justify-center py-3">
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
              </div>
            )}

            {keyFactor &&
              !hasComment &&
              isNewsKF(keyFactor) &&
              keyFactor.news && (
                <div className="mt-auto flex items-end justify-center pb-2">
                  <a
                    href={keyFactor.news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-900 px-4 py-2 text-base font-medium leading-5 text-gray-200 no-underline dark:bg-blue-900-dark dark:text-gray-200-dark"
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                    {t("viewArticle")}
                  </a>
                </div>
              )}

            {keyFactor && hasComment && (
              <>
                <span className="mt-2 text-center text-sm font-medium leading-5 text-gray-1000/50 dark:text-gray-1000-dark/50">
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
