"use client";

import Link from "next/link";
import { FC, useEffect, useMemo, useState } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionCPMovement from "@/components/cp_movement";
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
import QuestionLinkAgreeVoter from "./question_link_agree_voter";

type Props = {
  link: FetchedAggregateCoherenceLink;
  post: PostWithForecasts;
  compact?: boolean;
  id?: string;
  mode?: "forecaster" | "consumer";
  linkToComment?: boolean;
  className?: string;
};

const otherQuestionCache = new Map<number, QuestionWithForecasts>();

const QuestionLinkKeyFactorItem: FC<Props> = ({
  link,
  post,
  compact,
  id,
  mode = "forecaster",
  linkToComment = true,
  className,
}) => {
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
    handleUpvotePanelToggle,
    handleDownvotePanelToggle,
  } = useKeyFactorVotePanels();

  if (!otherQuestion || !post.question) return null;

  const binaryForecastQuestion =
    otherQuestion?.type === QuestionType.Binary
      ? (otherQuestion as QuestionWithNumericForecasts & QuestionWithForecasts)
      : null;

  const fromQuestion = isFirstQuestion ? post.question : otherQuestion;
  const toQuestion = isFirstQuestion ? otherQuestion : post.question;
  const defaultDirection: QuestionLinkDirection =
    link.direction && link.direction < 0 ? "negative" : "positive";

  const impactDirection: ImpactDirection | null = link.direction
    ? link.direction > 0
      ? "increase"
      : "decrease"
    : null;

  return (
    <div ref={impactPanel.anchorRef}>
      <KeyFactorCardContainer
        id={id}
        linkToComment={linkToComment}
        isCompact={compact}
        mode={mode}
        impactDirection={impactDirection}
        impactStrength={strengthScore}
        className={cn("shadow-sm", className)}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href={getPostLink({ id: otherQuestion.post_id })}
              target="_blank"
              className={cn(
                "min-w-0 flex-1 font-medium text-gray-800 no-underline hover:underline dark:text-gray-800-dark",
                compact ? "text-xs leading-4" : "text-sm leading-5"
              )}
            >
              {otherQuestion.title}
            </Link>

            {binaryForecastQuestion && (
              <div className="relative h-[46px] w-14 shrink-0">
                <div className="absolute inset-0 flex flex-col items-center">
                  <BinaryCPBar
                    question={
                      binaryForecastQuestion as unknown as QuestionWithNumericForecasts
                    }
                    size="xs"
                  />
                  <div className="-mt-5">
                    <QuestionCPMovement
                      question={binaryForecastQuestion}
                      unit="%"
                      boldValueUnit
                      size="xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

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

        <div
          className="flex items-end justify-between"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <QuestionLinkAgreeVoter
            aggregationId={link.id}
            fromQuestion={fromQuestion}
            toQuestion={toQuestion}
            defaultDirection={defaultDirection}
            defaultStrength="medium"
            targetElementId={id}
            onChange={(next) => setUserVote(next)}
            onStrengthChange={(s) => setLocalStrength(s)}
            onVotePanelToggle={handleUpvotePanelToggle}
            onDownvotePanelToggle={handleDownvotePanelToggle}
          />
        </div>
      </KeyFactorCardContainer>

      <KeyFactorVotePanels
        impactPanel={impactPanel}
        downvotePanel={downvotePanel}
        anchorRef={impactPanel.anchorRef}
        isCompact={compact}
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
