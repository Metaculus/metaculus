"use client";

import {
  faArrowUpRightFromSquare,
  faChevronLeft,
  faChevronRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import useEmblaCarousel from "embla-carousel-react";
import { useLocale, useTranslations } from "next-intl";
import {
  FC,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  findById,
  useCommentsFeed,
} from "@/app/(main)/components/comments_feed_provider";
import CommentActionBar from "@/components/comment_feed/comment_action_bar";
import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import MarkdownEditor from "@/components/markdown_editor";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { CommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithNumericForecasts } from "@/types/question";
import { VoteDirection } from "@/types/votes";
import { parseUserMentions } from "@/utils/comments";
import cn from "@/utils/core/cn";
import { formatDate } from "@/utils/formatters/date";
import { formatUsername } from "@/utils/formatters/users";
import { isNewsKF } from "@/utils/key_factors";

import { KeyFactorItem } from "./item_view";
import { useQuestionLayoutSafe } from "../question_layout/question_layout_context";
import QuestionLinkKeyFactorItem from "./item_view/question_link/question_link_key_factor_item";

type Props = {
  questionLink: FetchedAggregateCoherenceLink | null;
  post: PostWithForecasts;
  binaryQuestion: QuestionWithNumericForecasts | null;
  allPostKeyFactors: KeyFactor[];
  initialIndex: number;
  onClose: () => void;
  onSelectKeyFactor?: (keyFactor: KeyFactor) => void;
};

const MobileKeyFactorOverlay: FC<Props> = ({
  questionLink,
  post,
  binaryQuestion,
  allPostKeyFactors,
  initialIndex,
  onClose,
  onSelectKeyFactor,
}) => {
  const t = useTranslations();
  const locale = useLocale();
  const { comments, ensureCommentLoaded, updateComment } = useCommentsFeed();
  const questionLayout = useQuestionLayoutSafe();

  const isCarousel = !questionLink && allPostKeyFactors.length > 1;

  // Freeze the starting slide to the tapped key factor so re-renders (triggered
  // by onSelectKeyFactor) don't re-init embla and fight the user's swipes.
  const startIndexRef = useRef(Math.max(initialIndex, 0));
  const emblaOptions = useMemo(
    () => ({
      align: "center" as const,
      startIndex: startIndexRef.current,
      containScroll: "trimSnaps" as const,
    }),
    []
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  const [selectedIndex, setSelectedIndex] = useState(startIndexRef.current);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // The parent passes a fresh onSelectKeyFactor each render; keep it in a ref so
  // syncState stays stable and the embla subscription isn't torn down/looped.
  const onSelectKeyFactorRef = useRef(onSelectKeyFactor);
  onSelectKeyFactorRef.current = onSelectKeyFactor;
  // Only notify the parent on a genuine index change (not on mount/re-init),
  // otherwise the parent's setState would feed back into another notify.
  const lastNotifiedRef = useRef(startIndexRef.current);

  const syncState = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setSelectedIndex(idx);
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    const kf = allPostKeyFactors[idx];
    if (kf) {
      void ensureCommentLoaded(kf.comment_id);
      if (idx !== lastNotifiedRef.current) {
        lastNotifiedRef.current = idx;
        onSelectKeyFactorRef.current?.(kf);
      }
    }
  }, [emblaApi, allPostKeyFactors, ensureCommentLoaded]);

  useEffect(() => {
    if (!emblaApi) return;
    syncState();
    emblaApi.on("select", syncState);
    emblaApi.on("reInit", syncState);
    return () => {
      emblaApi.off("select", syncState);
      emblaApi.off("reInit", syncState);
    };
  }, [emblaApi, syncState]);

  // Load the initially shown comment up front (covers the non-carousel path
  // where there is no embla instance to drive syncState).
  useEffect(() => {
    const kf = allPostKeyFactors[startIndexRef.current];
    if (kf) void ensureCommentLoaded(kf.comment_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSlide = useCallback(
    (idx: number) => emblaApi?.scrollTo(idx),
    [emblaApi]
  );

  const handleScrollToComment = useCallback(
    async (kf: KeyFactor) => {
      await ensureCommentLoaded(kf.comment_id);
      onClose();
      questionLayout?.setActiveTab("comments");
      setTimeout(() => {
        questionLayout?.requestScrollToComment(kf.comment_id);
      }, 50);
    },
    [ensureCommentLoaded, onClose, questionLayout]
  );

  const handleReplyToComment = useCallback(
    async (kf: KeyFactor) => {
      await ensureCommentLoaded(kf.comment_id);
      onClose();
      questionLayout?.setActiveTab("comments");
      setTimeout(() => {
        questionLayout?.requestReplyToComment(kf.comment_id);
      }, 50);
    },
    [ensureCommentLoaded, onClose, questionLayout]
  );

  const handleVoteChange = useCallback(
    (kf: KeyFactor, voteScore: number, userVote: VoteDirection | null) => {
      updateComment(kf.comment_id, {
        vote_score: voteScore,
        user_vote: userVote,
      });
    },
    [updateComment]
  );

  const handleCmmToggle = useCallback(
    (kf: KeyFactor, comment: CommentType | null, enabled: boolean) => {
      if (!comment) return;
      const prev = comment.changed_my_mind;
      const countDelta = prev.for_this_user === enabled ? 0 : enabled ? 1 : -1;
      updateComment(kf.comment_id, {
        changed_my_mind: {
          for_this_user: enabled,
          count: prev.count + countDelta,
        },
      });
    },
    [updateComment]
  );

  const renderSlide = (kf: KeyFactor) => {
    const comment = findById(comments, kf.comment_id);
    // While the comment is still loading we optimistically show the comment
    // region (with a skeleton); an empty loaded comment hides it.
    const hasComment = !!(comment?.text?.trim() || !comment);
    const relatedKeyFactors = allPostKeyFactors.filter(
      (other) => other.id !== kf.id && other.comment_id === kf.comment_id
    );
    const showNewsCta = !hasComment && isNewsKF(kf) && kf.news;

    return (
      <div className="h-full overflow-y-auto overscroll-contain">
        <div className="flex min-h-full flex-col gap-2">
          <div className="shrink-0">
            <KeyFactorItem
              keyFactor={kf}
              linkToComment={false}
              projectPermission={post.user_permission}
              large
            />
          </div>

          {hasComment && (
            <div className="flex flex-1 flex-col rounded-xl bg-blue-200 px-5 py-4 dark:bg-blue-200-dark">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <h4 className="my-0 break-words text-base font-bold leading-6 text-gray-800 dark:text-gray-800-dark">
                    {formatUsername(kf.author)}
                  </h4>
                  <span
                    className="text-sm leading-5 text-gray-500 dark:text-gray-500-dark"
                    suppressHydrationWarning
                  >
                    {t("onDate", {
                      date: formatDate(locale, new Date(kf.created_at)),
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handleScrollToComment(kf)}
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
                    {relatedKeyFactors.map((related) => (
                      <KeyFactorItem
                        key={related.id}
                        keyFactor={related}
                        isCompact
                        projectPermission={post.user_permission}
                        className="w-[160px] shrink-0"
                        onClick={() => {
                          const idx = allPostKeyFactors.findIndex(
                            (item) => item.id === related.id
                          );
                          if (idx >= 0) scrollToSlide(idx);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-auto pt-4">
                {!comment ? (
                  <div className="flex animate-pulse items-center gap-3 text-sm leading-4">
                    <div className="inline-flex items-center gap-2 rounded-sm border border-blue-500/30 px-1 dark:border-blue-600/30">
                      <div className="size-6 rounded-sm bg-gray-200 dark:bg-gray-200-dark" />
                      <div className="h-3 w-4 rounded bg-gray-200 dark:bg-gray-200-dark" />
                      <div className="size-6 rounded-sm bg-gray-200 dark:bg-gray-200-dark" />
                    </div>
                  </div>
                ) : (
                  <CommentActionBar
                    comment={comment}
                    post={post}
                    onReply={() => handleReplyToComment(kf)}
                    onScrollToLink={() => handleScrollToComment(kf)}
                    onVoteChange={(voteScore, userVote) =>
                      handleVoteChange(kf, voteScore, userVote)
                    }
                    onCmmToggle={(enabled) =>
                      handleCmmToggle(kf, comment, enabled)
                    }
                  />
                )}
              </div>
            </div>
          )}

          {showNewsCta && kf.news && (
            <div className="flex flex-1 items-end justify-center pb-2">
              <a
                href={kf.news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-900 px-4 py-2 text-base font-medium leading-5 text-gray-200 no-underline dark:bg-blue-900-dark dark:text-gray-200-dark"
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                {t("viewArticle")}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const singleSlide = questionLink ? (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0">
        <QuestionLinkKeyFactorItem
          link={questionLink}
          post={post}
          linkToComment={false}
        />
      </div>
    </div>
  ) : allPostKeyFactors[0] ? (
    renderSlide(allPostKeyFactors[0])
  ) : null;

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-modal" onClose={onClose}>
        <div className="fixed inset-0 bg-white/90 backdrop-blur-[10px] dark:bg-gray-0-dark/90" />
        <DialogPanel className="fixed inset-x-0 top-0 flex h-[100dvh] flex-col px-4 pb-3 pt-3">
          <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
            <span className="text-[11px] font-medium uppercase leading-3 tracking-wide text-gray-500 dark:text-gray-500-dark">
              {t("keyFactorsFor")}
            </span>
            <button
              aria-label={t("close")}
              onClick={onClose}
              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-blue-400 bg-gray-0 text-sm text-blue-700 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-700-dark"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <h2 className="mt-0 min-w-0 flex-1 text-base font-semibold leading-5 tracking-tight text-gray-800 dark:text-gray-800-dark">
              {post.title}
            </h2>
            {binaryQuestion && (
              <BinaryCPBar
                question={binaryQuestion}
                size="sm"
                className="shrink-0"
              />
            )}
          </div>

          <div className="mt-3 min-h-0 flex-1">
            {isCarousel ? (
              <div ref={emblaRef} className="-mx-4 h-full overflow-hidden">
                <div className="flex h-full px-2.5">
                  {allPostKeyFactors.map((kf) => (
                    <div key={kf.id} className="min-w-0 flex-[0_0_86%] px-1.5">
                      {renderSlide(kf)}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              singleSlide
            )}
          </div>

          {isCarousel && (
            <div className="flex shrink-0 items-center justify-between gap-3 pt-3">
              <button
                aria-label={t("previous")}
                disabled={!canPrev}
                onClick={() => scrollToSlide(selectedIndex - 1)}
                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-blue-400 bg-gray-0 text-xl text-blue-700 transition-opacity disabled:opacity-30 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-700-dark"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <div className="flex justify-center gap-1.5">
                {allPostKeyFactors.map((kf, i) => (
                  <button
                    key={kf.id}
                    type="button"
                    aria-label={t("goToKeyFactor", { number: i + 1 })}
                    onClick={() => scrollToSlide(i)}
                    className={cn(
                      "size-2 rounded-full transition-colors",
                      i === selectedIndex
                        ? "bg-blue-700 dark:bg-blue-700-dark"
                        : "bg-gray-400 dark:bg-gray-400-dark"
                    )}
                  />
                ))}
              </div>
              <button
                aria-label={t("next")}
                disabled={!canNext}
                onClick={() => scrollToSlide(selectedIndex + 1)}
                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-blue-400 bg-gray-0 text-xl text-blue-700 transition-opacity disabled:opacity-30 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-700-dark"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </DialogPanel>
      </Dialog>
    </Transition>
  );
};

export default MobileKeyFactorOverlay;
