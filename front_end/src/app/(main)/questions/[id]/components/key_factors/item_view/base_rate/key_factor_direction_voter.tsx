"use client";

import { faThumbsDown, faThumbsUp } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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

    const aggregatedData: { score: number; count: number }[] =
      prev.aggregated_data.map((item) => ({
        score: item.score,
        count: item.count,
      }));

    const bump = (score: 5 | -5, delta: number) => {
      if (delta === 0) return;
      const idx = aggregatedData.findIndex((a) => a.score === score);
      if (idx === -1) {
        if (delta > 0) {
          aggregatedData.push({ score, count: delta });
        }
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

  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={submitting}
          aria-pressed={userVote === 5}
          onClick={() => toggle(5)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-xs font-normal transition-colors",
            userVote === 5
              ? "border-olive-700 bg-olive-700 text-gray-0 dark:border-olive-700-dark dark:bg-olive-700-dark dark:text-gray-0-dark"
              : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
          )}
        >
          <FontAwesomeIcon
            className={cn(
              "text-[14px]",
              userVote === 5
                ? "text-gray-0 dark:text-gray-0-dark"
                : "text-olive-700 dark:text-olive-700-dark"
            )}
            icon={faThumbsUp}
          />
          <span>
            {helpful} {t("helpful")}
          </span>
        </button>

        <button
          type="button"
          disabled={submitting}
          aria-pressed={userVote === -5}
          onClick={() => toggle(-5)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[4px] border border-blue-400 px-2 py-1 text-xs font-normal transition-colors dark:border-blue-400-dark",
            userVote === -5
              ? "border-salmon-600 bg-salmon-600 text-gray-0 dark:border-salmon-600-dark dark:bg-salmon-600-dark dark:text-gray-0-dark"
              : "hover:dark:bg-gray-50-dark border-blue-400 bg-gray-0 text-blue-800 hover:bg-gray-50 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-blue-800-dark"
          )}
        >
          <FontAwesomeIcon
            className={cn(
              "text-[14px]",
              userVote === -5
                ? "text-gray-0 dark:text-gray-0-dark"
                : "text-salmon-600 dark:text-salmon-600-dark"
            )}
            icon={faThumbsDown}
          />
          <span>
            {notHelpful} {t("notHelpful")}
          </span>
        </button>
      </div>

      <KeyFactorDropdownMenuItems
        keyFactor={{ ...keyFactor, vote: aggregate }}
        projectPermission={projectPermission}
      />
    </div>
  );
};

export default KeyFactorDirectionVoter;
