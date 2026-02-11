"use client";

import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import {
  KeyFactor,
  KeyFactorVoteAggregate,
  KeyFactorVoteTypes,
} from "@/types/comment";
import { ProjectPermissions } from "@/types/post";
import cn from "@/utils/core/cn";

import KeyFactorDropdownMenuItems from "../dropdown_menu_items";
import ThumbVoteButtons, { ThumbVoteSelection } from "../thumb_vote_buttons";

type Props = {
  keyFactor: KeyFactor;
  projectPermission?: ProjectPermissions;
  className?: string;
};

const KeyFactorDirectionVoter: React.FC<Props> = ({
  keyFactor,
  projectPermission,
  className,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const { setKeyFactorVote } = useCommentsFeed();

  const [aggregate, setAggregate] = useState<KeyFactorVoteAggregate>(
    keyFactor.vote
  );
  const [submitting, setSubmitting] = useState(false);
  const userVote = aggregate?.user_vote as 5 | -5 | null;

  const { helpful, notHelpful } = useMemo(() => {
    const arr = aggregate?.aggregated_data ?? [];
    return {
      helpful: arr.find((a) => a.score === 5)?.count ?? 0,
      notHelpful: arr.find((a) => a.score === -5)?.count ?? 0,
    };
  }, [aggregate]);

  const applyOptimisticUpdate = (
    prev: KeyFactorVoteAggregate,
    next: 5 | -5 | null
  ): KeyFactorVoteAggregate => {
    const prevVote = (prev.user_vote as 5 | -5 | null) ?? null;
    if (prevVote === next) return prev;

    const deltaHelpful = (prevVote === 5 ? -1 : 0) + (next === 5 ? 1 : 0);
    const deltaNotHelpful = (prevVote === -5 ? -1 : 0) + (next === -5 ? 1 : 0);

    const aggregatedData = prev.aggregated_data.map((item) => ({
      score: item.score,
      count: item.count,
    }));

    const bump = (score: 5 | -5, delta: number) => {
      if (delta === 0) return;
      const idx = aggregatedData.findIndex((a) => a.score === score);
      if (idx === -1) {
        if (delta > 0) aggregatedData.push({ score, count: delta });
        return;
      }
      const item = aggregatedData[idx];
      aggregatedData[idx] = {
        score: item?.score ?? 0,
        count: Math.max(0, (item?.count ?? 0) + delta),
      };
    };

    bump(5, deltaHelpful);
    bump(-5, deltaNotHelpful);

    return {
      ...prev,
      user_vote: next,
      aggregated_data: aggregatedData,
    };
  };

  const submit = async (next: 5 | -5 | null) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    if (user.is_bot) return;
    if (submitting) return;
    setSubmitting(true);

    const optimistic = applyOptimisticUpdate(aggregate, next);
    setAggregate(optimistic);
    setKeyFactorVote(keyFactor.id, optimistic);

    try {
      const resp = await voteKeyFactor({
        id: keyFactor.id,
        vote: next,
        user: user.id,
        vote_type: KeyFactorVoteTypes.DIRECTION,
      });

      if (resp) {
        const updated = resp as unknown as KeyFactorVoteAggregate;
        setAggregate(updated);
        setKeyFactorVote(keyFactor.id, updated);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = (value: 5 | -5) => submit(userVote === value ? null : value);

  const selection: ThumbVoteSelection =
    userVote === 5 ? "up" : userVote === -5 ? "down" : null;

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <ThumbVoteButtons
        upCount={helpful}
        downCount={notHelpful}
        upLabel={t("helpful")}
        downLabel={t("notHelpful")}
        selected={selection}
        disabled={submitting}
        onClickUp={() => toggle(5)}
        onClickDown={() => toggle(-5)}
      />

      <KeyFactorDropdownMenuItems
        keyFactor={{ ...keyFactor, vote: aggregate }}
        projectPermission={projectPermission}
      />
    </div>
  );
};

export default KeyFactorDirectionVoter;
