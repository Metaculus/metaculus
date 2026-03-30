"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Dialog, DialogPanel, Transition } from "@headlessui/react";
import { useTranslations } from "next-intl";
import { FC, Fragment, useEffect, useMemo } from "react";

import {
  findById,
  useCommentsFeed,
} from "@/app/(main)/components/comments_feed_provider";
import { useBreakpoint } from "@/hooks/tailwind";
import { FetchedAggregateCoherenceLink } from "@/types/coherence";
import { BECommentType, KeyFactor } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { VoteDirection } from "@/types/votes";

import CommentDetailPanel from "./comment_detail_panel";
import { KeyFactorItem } from "./item_view";
import { useQuestionLayoutSafe } from "../question_layout/question_layout_context";
import QuestionLinkKeyFactorItem from "./item_view/question_link/question_link_key_factor_item";
import MobileKeyFactorOverlay from "./mobile_key_factor_overlay";

type KeyFactorOverlayProps = {
  keyFactor: KeyFactor;
  allKeyFactors: KeyFactor[];
  post: PostWithForecasts;
  preloadedComment?: BECommentType | null;
  onClose: () => void;
  onSelectKeyFactor: (keyFactor: KeyFactor) => void;
  questionLink?: never;
};

type QuestionLinkOverlayProps = {
  questionLink: FetchedAggregateCoherenceLink;
  post: PostWithForecasts;
  onClose: () => void;
  keyFactor?: never;
  allKeyFactors?: never;
  preloadedComment?: never;
  onSelectKeyFactor?: never;
};

type Props = KeyFactorOverlayProps | QuestionLinkOverlayProps;

const KeyFactorDetailOverlay: FC<Props> = (props) => {
  const { post, onClose } = props;
  const t = useTranslations();
  const { comments, ensureCommentLoaded, updateComment } = useCommentsFeed();
  const questionLayout = useQuestionLayoutSafe();
  const isAboveSm = useBreakpoint("sm");

  const keyFactor = props.keyFactor ?? null;
  const questionLink = props.questionLink ?? null;

  const feedComment = useMemo(
    () => (keyFactor ? findById(comments, keyFactor.comment_id) : null),
    [comments, keyFactor]
  );

  const comment = feedComment ?? props.preloadedComment ?? null;

  useEffect(() => {
    if (keyFactor && !comment) {
      ensureCommentLoaded(keyFactor.comment_id);
    }
  }, [keyFactor, comment, ensureCommentLoaded]);

  const handleVoteChange = (
    voteScore: number,
    userVote: VoteDirection | null
  ) => {
    if (!keyFactor) return;
    updateComment(keyFactor.comment_id, {
      vote_score: voteScore,
      user_vote: userVote,
    });
  };

  const handleCmmToggle = (enabled: boolean) => {
    if (!keyFactor) return;
    const existing = feedComment ?? props.preloadedComment;
    if (!existing) return;
    const prev = existing.changed_my_mind;
    const countDelta = prev.for_this_user === enabled ? 0 : enabled ? 1 : -1;
    updateComment(keyFactor.comment_id, {
      changed_my_mind: {
        for_this_user: enabled,
        count: prev.count + countDelta,
      },
    });
  };

  const relatedKeyFactors = keyFactor
    ? (props.allKeyFactors ?? []).filter(
        (kf) => kf.id !== keyFactor.id && kf.comment_id === keyFactor.comment_id
      )
    : [];

  const allPostKeyFactors = useMemo(
    () => props.allKeyFactors ?? [],
    [props.allKeyFactors]
  );
  const currentIndex = allPostKeyFactors.findIndex(
    (kf) => kf.id === keyFactor?.id
  );
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allPostKeyFactors.length - 1;

  const binaryQuestion = useMemo(() => {
    const q = post.question;
    if (q && q.type === QuestionType.Binary) {
      return q as QuestionWithNumericForecasts;
    }
    return null;
  }, [post.question]);

  const handleScrollToComment = async () => {
    if (!keyFactor) return;
    await ensureCommentLoaded(keyFactor.comment_id);
    onClose();
    setTimeout(() => {
      const el = document.getElementById(`comment-${keyFactor.comment_id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  };

  const handleReplyToComment = async () => {
    if (!keyFactor) return;
    await ensureCommentLoaded(keyFactor.comment_id);
    onClose();
    setTimeout(() => {
      questionLayout?.requestReplyToComment(keyFactor.comment_id);
    }, 500);
  };

  const hasComment = !!(keyFactor && (comment?.text?.trim() || !comment));
  const isSimple =
    questionLink ||
    !keyFactor?.driver ||
    (relatedKeyFactors.length === 0 && !comment?.text?.trim());

  if (!isAboveSm) {
    return (
      <MobileKeyFactorOverlay
        keyFactor={keyFactor}
        questionLink={questionLink}
        post={post}
        comment={comment}
        binaryQuestion={binaryQuestion}
        relatedKeyFactors={relatedKeyFactors}
        allPostKeyFactors={allPostKeyFactors}
        currentIndex={currentIndex}
        hasPrev={hasPrev}
        hasNext={hasNext}
        hasComment={hasComment}
        onClose={onClose}
        onSelectKeyFactor={props.onSelectKeyFactor}
        onScrollToComment={handleScrollToComment}
        onVoteChange={handleVoteChange}
        onCmmToggle={handleCmmToggle}
      />
    );
  }

  const closeButton = (
    <button
      aria-label={t("close")}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="absolute -top-10 right-0 flex size-8 items-center justify-center rounded-full bg-gray-0 text-gray-600 shadow dark:bg-gray-800-dark dark:text-gray-300-dark"
    >
      <FontAwesomeIcon icon={faXmark} />
    </button>
  );

  if (isSimple || !keyFactor || !props.onSelectKeyFactor) {
    return (
      <Transition appear show as={Fragment}>
        <Dialog as="div" className="relative z-[201]" onClose={onClose}>
          <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-md dark:bg-gray-1000/60" />
          <div className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4 pb-4 pt-14">
            <DialogPanel className="w-full max-w-md" onClick={onClose}>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                {closeButton}
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
                      inlineVotePanels
                    />
                  )
                )}
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </Transition>
    );
  }

  return (
    <Transition appear show as={Fragment}>
      <Dialog as="div" className="relative z-[201]" onClose={onClose}>
        <div className="fixed inset-0 bg-blue-900/60 backdrop-blur-md dark:bg-gray-1000/60" />
        <div className="fixed inset-0 flex items-center justify-center overflow-y-auto px-4 pb-4 pt-14">
          <DialogPanel
            className="relative flex w-full max-w-4xl flex-col gap-4 lg:flex-row lg:items-center lg:gap-3"
            onClick={onClose}
          >
            {closeButton}
            <div
              className="shrink-0 lg:w-[315px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="lg:w-[252px] lg:origin-left lg:scale-[125%]">
                <KeyFactorItem
                  keyFactor={keyFactor}
                  linkToComment={false}
                  projectPermission={post.user_permission}
                  inlineVotePanels
                  disableHover
                />
              </div>
            </div>

            <CommentDetailPanel
              keyFactor={keyFactor}
              relatedKeyFactors={relatedKeyFactors}
              post={post}
              comment={comment}
              isLoading={!comment}
              onScrollToComment={handleScrollToComment}
              onReplyToComment={handleReplyToComment}
              onSelectKeyFactor={props.onSelectKeyFactor}
              onVoteChange={handleVoteChange}
              onCmmToggle={handleCmmToggle}
            />
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  );
};

export default KeyFactorDetailOverlay;
