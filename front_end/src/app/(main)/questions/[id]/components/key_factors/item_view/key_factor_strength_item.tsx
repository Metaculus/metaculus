"use client";
import { isNil } from "lodash";
import { FC, PropsWithChildren, useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import KeyFactorDropdownMenuItems from "@/app/(main)/questions/[id]/components/key_factors/item_view/dropdown_menu_items";
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
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import { KeyFactorImpactDirectionLabel } from "../item_creation/driver/impact_direction_label";
import { convertNumericImpactToDirectionCategory } from "../utils";
import ThumbVoteButtons, { ThumbVoteSelection } from "./thumb_vote_buttons";

type Props = PropsWithChildren<{
  keyFactor: KeyFactor;
  isCompact?: boolean;
  mode?: "forecaster" | "consumer";
  projectPermission?: ProjectPermissions;
  impactMetadata?: ImpactMetadata;
  voteType?: KeyFactorVoteTypes;
  onVotePanelToggle?: (open: boolean) => void;
}>;

const KeyFactorStrengthItem: FC<Props> = ({
  keyFactor,
  isCompact,
  mode = "forecaster",
  projectPermission,
  children,
  impactMetadata,
  voteType = KeyFactorVoteTypes.STRENGTH,
  onVotePanelToggle,
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

  const userVote = aggregate?.user_vote ?? null;
  const { upCount, downCount } = useMemo(() => {
    const arr = aggregate?.aggregated_data ?? [];
    return {
      upCount: arr.find((a) => a.score === upScore)?.count ?? 0,
      downCount: arr.find((a) => a.score === downScore)?.count ?? 0,
    };
  }, [aggregate, upScore, downScore]);

  const selection: ThumbVoteSelection =
    userVote === upScore ? "up" : userVote === downScore ? "down" : null;

  const submit = async (next: number | null) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    if (user.is_bot || submitting) return;
    setSubmitting(true);

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
    } finally {
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
          }}
        />
        {!isCompact && (
          <KeyFactorDropdownMenuItems
            keyFactor={{ ...keyFactor, vote: aggregate }}
            projectPermission={projectPermission}
          />
        )}
      </div>
    </>
  );
};

export default KeyFactorStrengthItem;
