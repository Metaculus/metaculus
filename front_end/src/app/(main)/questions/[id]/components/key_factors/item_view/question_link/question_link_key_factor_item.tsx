"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import ClientPostsApi from "@/services/api/posts/posts.client";
import {
  FetchedAggregateCoherenceLink,
  QuestionLinkDirection,
} from "@/types/coherence";
import { ImpactDirection, ImpactDirectionCategory } from "@/types/comment";
import { PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import cn from "@/utils/core/cn";
import { getPostLink } from "@/utils/navigation";

import { KeyFactorImpactDirectionLabel } from "../../item_creation/driver/impact_direction_label";
import KeyFactorCardContainer from "../key_factor_card_container";
import KeyFactorVotePanels, {
  useKeyFactorVotePanels,
} from "../key_factor_vote_panels";
import { ActionItem } from "../more_panel";
import QuestionLinkAgreeVoter from "./question_link_agree_voter";
import { useQuestionLinkCopy } from "./use_question_link_copy";

type Props = {
  link: FetchedAggregateCoherenceLink;
  post: PostWithForecasts;
  compact?: boolean;
  id?: string;
  mode?: "forecaster" | "consumer";
  linkToComment?: boolean;
  titleLinksToQuestion?: boolean;
  className?: string;
  onClick?: () => void;
};

const otherQuestionCache = new Map<number, QuestionWithForecasts>();

const QuestionLinkKeyFactorItem: FC<Props> = ({
  link,
  post,
  compact,
  id,
  mode = "forecaster",
  linkToComment = true,
  titleLinksToQuestion = true,
  className,
  onClick,
}) => {
  const t = useTranslations();
  const isConsumer = mode === "consumer";
  const isCompactConsumer = isConsumer && compact;

  const isFirstQuestion = link.question1_id === post.question?.id;
  const [otherQuestion, setOtherQuestion] =
    useState<QuestionWithForecasts | null>(null);

  const [localStrength, setLocalStrength] = useState<number | null>(
    link.strength ?? null
  );
  const [userVote, setUserVote] = useState<"agree" | "disagree" | null>(
    link.votes?.user_vote === 1
      ? "agree"
      : link.votes?.user_vote === -1
        ? "disagree"
        : null
  );

  useEffect(() => {
    setLocalStrength(link.strength ?? null);
  }, [link.strength, link.id]);

  useEffect(() => {
    setUserVote(
      link.votes?.user_vote === 1
        ? "agree"
        : link.votes?.user_vote === -1
          ? "disagree"
          : null
    );
  }, [link.id, link.votes?.user_vote]);

  useEffect(() => {
    let cancelled = false;

    const embedded = isFirstQuestion ? link.question2 : link.question1;
    const questionId = isFirstQuestion ? link.question2_id : link.question1_id;

    if (!questionId) return;

    const cached = otherQuestionCache.get(questionId);
    if (cached) {
      setOtherQuestion(cached);
      return;
    }

    const fetchOtherQuestionWithCP = async () => {
      try {
        if (embedded?.post_id) {
          const otherPost = await ClientPostsApi.getPost(
            embedded.post_id,
            true
          );
          if (!cancelled && otherPost.question) {
            const q = otherPost.question as QuestionWithForecasts;
            otherQuestionCache.set(questionId, q);
            setOtherQuestion(q);
          }
          return;
        }

        const q = await ClientPostsApi.getQuestion(questionId, false);
        if (cancelled) return;

        const postId = q.post_id as number | undefined;
        if (postId) {
          const otherPost = await ClientPostsApi.getPost(postId, true);
          if (!cancelled && otherPost.question) {
            const qWithCP = otherPost.question as QuestionWithForecasts;
            otherQuestionCache.set(questionId, qWithCP);
            setOtherQuestion(qWithCP);
          }
        } else {
          otherQuestionCache.set(questionId, q as QuestionWithForecasts);
          setOtherQuestion(q as QuestionWithForecasts);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load other question with CP", error);
        }
      }
    };

    fetchOtherQuestionWithCP();

    return () => {
      cancelled = true;
    };
  }, [isFirstQuestion, link]);

  const rawStrength = localStrength ?? link.strength ?? 0;
  const baseStrength =
    rawStrength > 0
      ? Math.max(0, Math.min(5, rawStrength))
      : link.direction
        ? 2.5
        : 0;
  const strengthScore =
    userVote === "agree" ? Math.max(baseStrength, 2.5) : baseStrength;

  const questionType: QuestionType | null =
    (isFirstQuestion ? otherQuestion?.type : post.question?.type) ?? null;

  const impactCategory = useMemo(
    () => mapDirectionToImpactCategory(link.direction, questionType),
    [link.direction, questionType]
  );

  const {
    impactPanel,
    downvotePanel,
    morePanel,
    handleUpvotePanelToggle,
    handleDownvotePanelToggle,
    handleMorePanelToggle,
    closeAllPanels,
  } = useKeyFactorVotePanels();

  const [showDownvoteThanks, setShowDownvoteThanks] = useState(false);

  const wrappedHandleDownvotePanelToggle = (open: boolean) => {
    if (open) {
      setShowDownvoteThanks(false);
    }
    handleDownvotePanelToggle(open);
  };

  const isFirstQuestionResolved = isFirstQuestion;
  const fromQuestionRaw = isFirstQuestionResolved
    ? post.question
    : otherQuestion;
  const toQuestionRaw = isFirstQuestionResolved ? otherQuestion : post.question;
  const defaultDirection: QuestionLinkDirection =
    link.direction && link.direction < 0 ? "negative" : "positive";

  const { hasPersonalCopy, openCopyModal } = useQuestionLinkCopy({
    fromQuestion: fromQuestionRaw ?? null,
    toQuestion: toQuestionRaw ?? null,
    defaultDirection,
    defaultStrength: "medium",
    targetElementId: id,
    onCloseAllPanels: closeAllPanels,
  });

  const moreActions: ActionItem[] = useMemo(() => {
    if (hasPersonalCopy) return [];
    return [
      {
        label: t("copyToMyAccount"),
        onClick: () => {
          morePanel.closePanel();
          openCopyModal();
        },
      },
    ];
  }, [hasPersonalCopy, t, morePanel, openCopyModal]);

  if (!otherQuestion || !post.question) {
    return (
      <KeyFactorCardContainer
        id={id}
        linkToComment={linkToComment}
        isCompact={compact}
        mode={mode}
        className={cn("animate-pulse shadow-sm", className)}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <div className="h-3 w-20 rounded bg-gray-200 dark:bg-gray-200-dark" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-200-dark" />
            <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-200-dark" />
          </div>
          <div className="h-3 w-28 rounded bg-gray-200 dark:bg-gray-200-dark" />
        </div>
        <div className="flex items-end">
          <div className="flex gap-0.5">
            <div className="h-6 w-12 rounded bg-gray-200 dark:bg-gray-200-dark" />
            <div className="h-6 w-12 rounded bg-gray-200 dark:bg-gray-200-dark" />
          </div>
        </div>
      </KeyFactorCardContainer>
    );
  }

  const binaryForecastQuestion =
    otherQuestion?.type === QuestionType.Binary
      ? (otherQuestion as QuestionWithNumericForecasts & QuestionWithForecasts)
      : null;

  const impactDirection: ImpactDirection | null = link.direction
    ? link.direction > 0
      ? "increase"
      : "decrease"
    : null;

  return (
    <div ref={impactPanel.anchorRef} className="self-start">
      <KeyFactorCardContainer
        id={id}
        linkToComment={linkToComment}
        isCompact={compact}
        mode={mode}
        impactDirection={impactDirection}
        impactStrength={strengthScore}
        className={cn("shadow-sm", className)}
        onClick={onClick}
      >
        <div className="flex min-w-0 flex-col gap-3">
          <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
            {t("questionLink")}
          </div>

          {titleLinksToQuestion ? (
            <Link
              href={getPostLink({ id: otherQuestion.post_id })}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "min-w-0 font-medium text-gray-800 no-underline hover:underline dark:text-gray-800-dark",
                compact ? "line-clamp-4 text-xs leading-4" : "text-sm leading-5"
              )}
            >
              {otherQuestion.title}
            </Link>
          ) : (
            <span
              className={cn(
                "min-w-0 font-medium text-gray-800 dark:text-gray-800-dark",
                compact
                  ? "line-clamp-4 text-xs leading-4"
                  : cn("text-sm leading-5", "line-clamp-5")
              )}
            >
              {otherQuestion.title}
            </span>
          )}

          {binaryForecastQuestion && (
            <div className="relative h-9 w-14">
              <div className="absolute inset-0 flex flex-col items-center">
                <BinaryCPBar
                  question={
                    binaryForecastQuestion as unknown as QuestionWithNumericForecasts
                  }
                  size="xs"
                />
              </div>
            </div>
          )}

          {impactCategory !== null && (
            <KeyFactorImpactDirectionLabel
              className={cn("text-xs", {
                "text-[10px]": isCompactConsumer,
              })}
              impact={impactCategory}
              unit={otherQuestion.unit || post.question?.unit || undefined}
              hideIcon
            />
          )}
        </div>

        <div className="flex w-full items-end">
          <div
            className="w-full"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <QuestionLinkAgreeVoter
              aggregationId={link.id}
              hasPersonalCopy={hasPersonalCopy}
              onChange={(next) => setUserVote(next)}
              onStrengthChange={(s) => setLocalStrength(s)}
              onVotePanelToggle={handleUpvotePanelToggle}
              onDownvotePanelToggle={wrappedHandleDownvotePanelToggle}
              onMorePanelToggle={handleMorePanelToggle}
              isMorePanelOpen={morePanel.showPanel}
            />
          </div>
        </div>
      </KeyFactorCardContainer>

      <KeyFactorVotePanels
        impactPanel={impactPanel}
        downvotePanel={downvotePanel}
        morePanel={morePanel}
        anchorRef={impactPanel.anchorRef}
        isCompact={compact}
        onDownvoteReasonSelect={() => setShowDownvoteThanks(true)}
        showDownvoteThanks={showDownvoteThanks}
        moreActions={moreActions}
        moreHeader={
          <span
            className={cn(
              "self-start font-normal leading-3 text-gray-500 dark:text-gray-500-dark",
              compact ? "text-[8px]" : "text-[10px]"
            )}
          >
            {t("questionLinkContributors", { count: link.links_nr })}
          </span>
        }
      />
    </div>
  );
};

const mapDirectionToImpactCategory = (
  direction: number | null,
  questionType: QuestionType | null
): ImpactDirectionCategory | null => {
  if (!direction || !questionType) return null;

  if (questionType === QuestionType.Binary) {
    return direction > 0
      ? ImpactDirectionCategory.Increase
      : ImpactDirectionCategory.Decrease;
  }

  if (questionType === QuestionType.Numeric) {
    return direction > 0
      ? ImpactDirectionCategory.More
      : ImpactDirectionCategory.Less;
  }

  if (questionType === QuestionType.Date) {
    return direction > 0
      ? ImpactDirectionCategory.Earlier
      : ImpactDirectionCategory.Later;
  }

  return null;
};

export default QuestionLinkKeyFactorItem;
