"use client";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { isNil } from "lodash";
import { FC, PropsWithChildren, useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
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
import ThumbVoteButtons, { ThumbVoteSelection } from "./thumb_vote_buttons";
import { useOptimisticVote } from "./use_optimistic_vote";

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
}) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const { combinedKeyFactors, setKeyFactorVote } = useCommentsFeed();
  const { question_type: questionType, unit } = keyFactor.post;

  const [submitting, setSubmitting] = useState(false);

  const aggregate = useMemo(() => {
    const contextKf = combinedKeyFactors.find((kf) => kf.id === keyFactor.id);
    return contextKf?.vote ?? keyFactor.vote;
  }, [combinedKeyFactors, keyFactor.id, keyFactor.vote]);

  const isDirection = voteType === KeyFactorVoteTypes.DIRECTION;
  const upScore = 5;
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

  const aggregatedData = aggregate?.aggregated_data ?? [];
  const {
    vote: userVote,
    upCount,
    downCount,
    setOptimistic,
    clearOptimistic,
  } = useOptimisticVote({
    serverVote: aggregate?.user_vote ?? null,
    serverUpCount: aggregatedData.find((a) => a.score === upScore)?.count ?? 0,
    serverDownCount:
      aggregatedData.find((a) => a.score === downScore)?.count ?? 0,
    upValue: upScore,
    downValue: downScore,
  });

  const selection: ThumbVoteSelection =
    userVote === upScore ? "up" : userVote === downScore ? "down" : null;

  const submit = async (next: number | null) => {
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
        setKeyFactorVote(keyFactor.id, updated);
      }
    } catch (e) {
      console.error("Failed to vote key factor", e);
    } finally {
      clearOptimistic();
      setSubmitting(false);
    }
  };

  const toggle = (value: number) => submit(userVote === value ? null : value);

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

      <div
        className="flex items-center justify-between"
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
            onVotePanelToggle?.(selection !== "up");
          }}
          onClickDown={() => {
            toggle(downScore);
            onVotePanelToggle?.(false);
            onDownvotePanelToggle?.(selection !== "down");
          }}
        />
        {!isCompact && onMorePanelToggle && (
          <button
            aria-label="menu"
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-xs",
              isMorePanelOpen
                ? "bg-blue-500 text-gray-0 dark:bg-blue-500-dark dark:text-gray-0-dark"
                : "text-gray-500 hover:bg-gray-300 dark:text-gray-500-dark dark:hover:bg-gray-300-dark"
            )}
            onClick={() => onMorePanelToggle(!isMorePanelOpen)}
          >
            <FontAwesomeIcon icon={faEllipsis} />
          </button>
        )}
      </div>
    </>
  );
};

export default KeyFactorStrengthItem;
