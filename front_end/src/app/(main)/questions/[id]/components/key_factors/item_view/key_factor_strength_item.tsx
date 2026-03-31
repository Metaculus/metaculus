"use client";
import { isNil } from "lodash";
import { FC, PropsWithChildren, useCallback, useMemo, useState } from "react";

import { useCommentsFeedSafe } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import {
  ImpactMetadata,
  KeyFactor,
  KeyFactorVoteAggregate,
  KeyFactorVoteTypes,
  StrengthValues,
} from "@/types/comment";
import cn from "@/utils/core/cn";

import { KeyFactorImpactDirectionLabel } from "../item_creation/driver/impact_direction_label";
import { convertNumericImpactToDirectionCategory } from "../utils";
import MoreActionsButton from "./more_actions_button";
import ThumbVoteButtons, { ThumbVoteSelection } from "./thumb_vote_buttons";
import { useOptimisticVote } from "./use_optimistic_vote";
import { ImpactOption } from "./use_vote_panel";

const IMPACT_SCORE_MAP: Record<ImpactOption, number> = {
  low: StrengthValues.LOW,
  medium: StrengthValues.MEDIUM,
  high: StrengthValues.HIGH,
};

export type ImpactVoteHandler = (option: ImpactOption) => void;

type Props = PropsWithChildren<{
  keyFactor: KeyFactor;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  impactMetadata?: ImpactMetadata;
  voteType?: KeyFactorVoteTypes;
  onVotePanelToggle?: (open: boolean) => void;
  onDownvotePanelToggle?: (open: boolean) => void;
  onMorePanelToggle?: (open: boolean) => void;
  isMorePanelOpen?: boolean;
  impactVoteRef?: React.MutableRefObject<ImpactVoteHandler | null>;
}>;

const KeyFactorStrengthItem: FC<Props> = ({
  keyFactor,
  isCompact,
  mode = "forecaster",
  children,
  impactMetadata,
  voteType = KeyFactorVoteTypes.STRENGTH,
  onVotePanelToggle,
  onDownvotePanelToggle,
  onMorePanelToggle,
  isMorePanelOpen,
  impactVoteRef,
}) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const commentsFeed = useCommentsFeedSafe();
  const { question_type: questionType, unit } = keyFactor.post;

  const [submitting, setSubmitting] = useState(false);

  const aggregate = useMemo(() => {
    const contextKf = commentsFeed?.combinedKeyFactors.find(
      (kf) => kf.id === keyFactor.id
    );
    return contextKf?.vote ?? keyFactor.vote;
  }, [commentsFeed?.combinedKeyFactors, keyFactor.id, keyFactor.vote]);

  const isDirection = voteType === KeyFactorVoteTypes.DIRECTION;
  const upScore = isDirection ? 5 : StrengthValues.MEDIUM;
  const downScore = isDirection ? -5 : StrengthValues.NO_IMPACT;

  const directionCategory =
    impactMetadata &&
    questionType &&
    convertNumericImpactToDirectionCategory(
      impactMetadata.impact_direction,
      impactMetadata.certainty,
      questionType
    );

  const isCompactConsumer = mode === "consumer" && isCompact;
  const isReadOnly = !commentsFeed;

  const aggregatedData = aggregate?.aggregated_data ?? [];
  const serverUpCount = isDirection
    ? aggregatedData.find((a) => a.score === upScore)?.count ?? 0
    : aggregatedData
        .filter((a) => a.score > 0)
        .reduce((sum, a) => sum + a.count, 0);
  const isUpVote = useCallback(
    (v: number | null) => (isDirection ? v === upScore : v !== null && v > 0),
    [isDirection, upScore]
  );
  const {
    vote: userVote,
    upCount,
    downCount,
    setOptimistic,
    clearOptimistic,
  } = useOptimisticVote({
    serverVote: aggregate?.user_vote ?? null,
    serverUpCount,
    serverDownCount:
      aggregatedData.find((a) => a.score === downScore)?.count ?? 0,
    upValue: upScore,
    downValue: downScore,
    isUpVote,
  });

  const selection: ThumbVoteSelection =
    userVote !== null && userVote > 0
      ? "up"
      : userVote === downScore
        ? "down"
        : null;

  const submit = useCallback(
    async (next: number | null) => {
      if (!user) {
        setCurrentModal({ type: "signin" });
        return;
      }
      if (user.is_bot || submitting) return;
      setSubmitting(true);
      setOptimistic(next);

      try {
        const resp = await voteKeyFactor({
          id: keyFactor.id,
          vote: next,
          user: user.id,
          vote_type: voteType,
        });
        if (resp) {
          const updated = resp as unknown as KeyFactorVoteAggregate;
          commentsFeed?.setKeyFactorVote(keyFactor.id, updated);
        }
      } catch (e) {
        console.error("Failed to vote key factor", e);
      } finally {
        clearOptimistic();
        setSubmitting(false);
      }
    },
    [
      user,
      submitting,
      setOptimistic,
      keyFactor.id,
      voteType,
      commentsFeed,
      clearOptimistic,
      setCurrentModal,
    ]
  );

  const toggle = (value: number) => {
    const isCurrentlyUp = isUpVote(userVote);
    const isCurrentlyDown = userVote === downScore;
    const togglingUp = value > 0;

    if (togglingUp && isCurrentlyUp) return submit(null);
    if (!togglingUp && isCurrentlyDown) return submit(null);
    return submit(value);
  };

  const submitImpactVote = useCallback(
    (option: ImpactOption) => {
      if (!user || user.is_bot) return;
      const currentVote = aggregate?.user_vote;
      if (!currentVote || currentVote <= 0) return;

      const newScore = IMPACT_SCORE_MAP[option];
      if (newScore === currentVote) return;

      submit(newScore);
    },
    [user, aggregate?.user_vote, submit]
  );

  if (impactVoteRef) {
    impactVoteRef.current = submitImpactVote;
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        {children}

        {!isNil(directionCategory) && (
          <KeyFactorImpactDirectionLabel
            className={cn("text-xs", {
              "text-[10px]": isCompactConsumer,
            })}
            unit={unit || keyFactor.question?.unit || undefined}
            option={
              keyFactor.question_option?.trim() ||
              keyFactor.question?.label ||
              undefined
            }
            impact={directionCategory}
            hideIcon
          />
        )}
      </div>

      {!isReadOnly && (
        <div className="flex items-end justify-between">
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ThumbVoteButtons
              upCount={upCount}
              downCount={downCount}
              selected={selection}
              disabled={submitting}
              onClickUp={() => {
                toggle(upScore);
                if (user) {
                  onVotePanelToggle?.(selection !== "up");
                }
              }}
              onClickDown={() => {
                toggle(downScore);
                if (user) {
                  onVotePanelToggle?.(false);
                  onDownvotePanelToggle?.(selection !== "down");
                }
              }}
            />
          </div>
          {!isCompactConsumer && onMorePanelToggle && (
            <MoreActionsButton
              isActive={isMorePanelOpen}
              onClick={(e) => {
                e.stopPropagation();
                onMorePanelToggle(!isMorePanelOpen);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}
    </>
  );
};

export default KeyFactorStrengthItem;
