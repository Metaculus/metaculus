"use client";

import { FC, useMemo, useState } from "react";

import useCoherenceLinksContext from "@/app/(main)/components/coherence_links_provider";
import { voteAggregateCoherenceLink } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import type { AggregateLinkVoteValue } from "@/services/api/coherence_links/coherence_links.shared";
import cn from "@/utils/core/cn";

import MoreActionsButton from "../more_actions_button";
import ThumbVoteButtons, { ThumbVoteSelection } from "../thumb_vote_buttons";
import { useOptimisticVote } from "../use_optimistic_vote";

type Props = {
  aggregationId?: number;
  hasPersonalCopy: boolean;
  onChange?: (next: "agree" | "disagree" | null) => void;
  onStrengthChange?: (strength: number | null) => void;
  onVotePanelToggle?: (open: boolean) => void;
  onDownvotePanelToggle?: (open: boolean) => void;
  onMorePanelToggle?: (open: boolean) => void;
  isMorePanelOpen?: boolean;
  className?: string;
};

const mapUserVoteToSelection = (
  v: number | null | undefined
): ThumbVoteSelection => {
  if (v === 1) return "up";
  if (v === -1) return "down";
  return null;
};

const QuestionLinkAgreeVoter: FC<Props> = ({
  aggregationId,
  hasPersonalCopy,
  onChange,
  onStrengthChange,
  onVotePanelToggle,
  onDownvotePanelToggle,
  onMorePanelToggle,
  isMorePanelOpen,
  className,
}) => {
  const { setCurrentModal } = useModal();
  const { aggregateCoherenceLinks, updateCoherenceLinks } =
    useCoherenceLinksContext();

  const [submitting, setSubmitting] = useState(false);

  const contextVotes = useMemo(() => {
    const agg = aggregateCoherenceLinks.data.find(
      (it) => it.id === aggregationId
    );
    const votes = agg?.votes;
    return {
      agree: votes?.aggregated_data?.find((x) => x.score === 1)?.count ?? 0,
      disagree: votes?.aggregated_data?.find((x) => x.score === -1)?.count ?? 0,
      userVote: (votes?.user_vote ?? null) as 1 | -1 | null,
    };
  }, [aggregateCoherenceLinks, aggregationId]);

  const {
    vote: currentVote,
    upCount: agree,
    downCount: disagree,
    setOptimistic,
    clearOptimistic,
  } = useOptimisticVote<1 | -1 | null>({
    serverVote: contextVotes.userVote,
    serverUpCount: contextVotes.agree,
    serverDownCount: contextVotes.disagree,
    upValue: 1,
    downValue: -1,
  });

  const selected = mapUserVoteToSelection(currentVote);

  const { user } = useAuth();

  const pushVote = async (next: "agree" | "disagree" | null) => {
    if (!aggregationId) return;

    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    if (user.is_bot) return;

    const vote: AggregateLinkVoteValue =
      next === "agree" ? 1 : next === "disagree" ? -1 : null;

    setSubmitting(true);
    setOptimistic(vote);
    try {
      const res = await voteAggregateCoherenceLink(aggregationId, vote);
      if ("errors" in res) return;

      const data = res.data;

      if ("strength" in data) {
        onStrengthChange?.(data.strength ?? null);
      }

      await updateCoherenceLinks();
    } catch (e) {
      console.error("Failed to vote aggregate coherence link", e);
    } finally {
      clearOptimistic();
      setSubmitting(false);
    }
  };

  const handleVote = (value: "agree" | "disagree") => {
    const next: "agree" | "disagree" | null =
      selected === "up" && value === "agree"
        ? null
        : selected === "down" && value === "disagree"
          ? null
          : value;

    onChange?.(next);
    void pushVote(next);
  };

  const showMoreButton = !hasPersonalCopy && onMorePanelToggle;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <ThumbVoteButtons
          upCount={agree}
          downCount={disagree}
          selected={selected}
          disabled={submitting}
          onClickUp={() => {
            handleVote("agree");
            onVotePanelToggle?.(selected !== "up");
          }}
          onClickDown={() => {
            handleVote("disagree");
            onDownvotePanelToggle?.(selected !== "down");
          }}
        />

        {showMoreButton && (
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
    </div>
  );
};

export default QuestionLinkAgreeVoter;
