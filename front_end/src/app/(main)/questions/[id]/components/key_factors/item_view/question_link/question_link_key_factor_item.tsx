"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useState } from "react";

import BinaryCPBar from "@/components/consumer_post_card/binary_cp_bar";
import QuestionCPMovement from "@/components/cp_movement";
import ClientPostsApi from "@/services/api/posts/posts.client";
import {
  FetchedAggregateCoherenceLink,
  QuestionLinkDirection,
} from "@/types/coherence";
import { ImpactDirectionCategory } from "@/types/comment";
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
import { StrengthScale } from "../key_factor_strength_voter";
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
  const t = useTranslations();
  const isConsumer = mode === "consumer";
  const isCompactConsumer = isConsumer && compact;

  const isFirstQuestion = link.question1_id === post.question?.id;
  const [otherQuestion, setOtherQuestion] =
    useState<QuestionWithForecasts | null>(null);

  const [localStrength, setLocalStrength] = useState<number | null>(
    link.strength ?? null
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

  const votesCount = link.links_nr ?? 0;

  const rawStrength = localStrength ?? 0;
  const strengthScore = Math.max(0, Math.min(5, rawStrength));

  const questionType: QuestionType | null =
    (isFirstQuestion ? otherQuestion?.type : post.question?.type) ?? null;

  const impactCategory = useMemo(
    () => mapDirectionToImpactCategory(link.direction, questionType),
    [link.direction, questionType]
  );

  if (!otherQuestion || !post.question) return null;

  const binaryForecastQuestion =
    otherQuestion?.type === QuestionType.Binary
      ? (otherQuestion as QuestionWithNumericForecasts & QuestionWithForecasts)
      : null;

  const fromQuestion = isFirstQuestion ? post.question : otherQuestion;
  const toQuestion = isFirstQuestion ? otherQuestion : post.question;
  const defaultDirection: QuestionLinkDirection =
    link.direction && link.direction < 0 ? "negative" : "positive";

  const votesSummary = link.votes;

  const initialAgree =
    votesSummary?.aggregated_data?.find((x) => x.score === 1)?.count ?? 0;
  const initialDisagree =
    votesSummary?.aggregated_data?.find((x) => x.score === -1)?.count ?? 0;

  const initialUserVote = votesSummary?.user_vote ?? null;

  return (
    <KeyFactorCardContainer
      id={id}
      linkToComment={linkToComment}
      isCompact={compact}
      mode={mode}
      className={cn(
        "shadow-sm",
        (compact || mode === "consumer") && "max-w-[240px]",
        isCompactConsumer && "max-w-[186px]",
        className
      )}
    >
      {!isConsumer && (
        <div className="flex justify-between">
          <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
            {t("questionLink")}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link
          href={getPostLink({ id: otherQuestion.post_id })}
          target="_blank"
          className={cn(
            "font-medium leading-5 text-gray-800 no-underline hover:underline dark:text-gray-800-dark",
            {
              "text-base": !isConsumer,
              "text-sm": isConsumer && !isCompactConsumer,
              "text-xs": isCompactConsumer,
            }
          )}
        >
          {otherQuestion.title}
        </Link>

        {binaryForecastQuestion && (
          <div
            className={cn(
              "flex flex-col items-center justify-center md:hidden",
              isConsumer && "w-[53px] md:flex"
            )}
          >
            <BinaryCPBar
              question={
                binaryForecastQuestion as unknown as QuestionWithNumericForecasts
              }
              size={isConsumer ? "xs" : "sm"}
            />
            <QuestionCPMovement
              question={binaryForecastQuestion}
              unit="%"
              boldValueUnit
              size="xs"
            />
          </div>
        )}
      </div>

      <div className="flex flex-row gap-4">
        {binaryForecastQuestion && (
          <div
            className={cn(
              "hidden flex-col items-center justify-center md:flex",
              isConsumer && "md:hidden"
            )}
          >
            <BinaryCPBar
              question={
                binaryForecastQuestion as unknown as QuestionWithNumericForecasts
              }
              size={isCompactConsumer ? "xs" : "sm"}
            />
            <QuestionCPMovement
              question={binaryForecastQuestion}
              unit="%"
              boldValueUnit
              size="xs"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3">
          {impactCategory !== null && (
            <div className="flex flex-col gap-1.5 leading-tight">
              <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
                {t("impact")}
              </div>
              <KeyFactorImpactDirectionLabel
                className={cn({
                  "text-[10px]": isCompactConsumer,
                })}
                impact={impactCategory}
                unit={otherQuestion.unit || post.question?.unit || undefined}
              />
            </div>
          )}

          <StrengthScale score={strengthScore} count={votesCount} mode={mode} />
        </div>
      </div>

      {!isConsumer && (
        <>
          <hr className="my-0 bg-gray-500 opacity-20 dark:bg-gray-500-dark" />
          <QuestionLinkAgreeVoter
            aggregationId={link.id}
            initialAgree={initialAgree}
            initialDisagree={initialDisagree}
            initialUserVote={initialUserVote}
            fromQuestion={fromQuestion}
            toQuestion={toQuestion}
            defaultDirection={defaultDirection}
            defaultStrength="medium"
            targetElementId={id}
            onStrengthChange={(s) => setLocalStrength(s)}
          />
        </>
      )}
    </KeyFactorCardContainer>
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
