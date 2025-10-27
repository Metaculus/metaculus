import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, ReactElement, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import {
  KeyFactorVoteAggregate,
  KeyFactorVoteTypes,
  StrengthValues,
  StrengthVoteOption,
} from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import SegmentedProgressBar from "./segmented_progress_bar";

type Props = {
  keyFactorId: number;
  vote: KeyFactorVoteAggregate;
  className?: string;
  allowVotes?: boolean;
  mode?: "forecaster" | "consumer";
  footerControls?: ReactElement;
};

const StrengthScale: FC<{
  score: number;
  count: number;
  mode?: "forecaster" | "consumer";
}> = ({ score, count, mode }) => {
  const t = useTranslations();

  const clamped = Math.max(0, Math.min(5, score ?? 0)) / 5;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full justify-between gap-2">
        <div className="text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
          {t("strength")}
        </div>
        <div className="text-[10px] lowercase text-blue-700 dark:text-blue-700-dark">
          {t("votesWithCount", { count })}
        </div>
      </div>
      <div
        className={cn("flex w-full gap-[1px]", {
          "rounded-[2px] border border-gray-0 dark:border-gray-0-dark":
            mode === "consumer",
        })}
      >
        <SegmentedProgressBar progress={clamped} segments={5} />
      </div>
    </div>
  );
};

const VoterControls: FC<{
  keyFactorId: number;
  aggregate: KeyFactorVoteAggregate;
  setAggregate: (newAggregation: KeyFactorVoteAggregate) => void;
  footerControls?: ReactElement;
}> = ({ keyFactorId, setAggregate, aggregate, footerControls }) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setKeyFactorVote } = useCommentsFeed();

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitVote = async (newValue: StrengthVoteOption | null) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Optimistic vote update
      setAggregate({ ...aggregate, user_vote: newValue });

      const response = await voteKeyFactor({
        id: keyFactorId,
        vote: newValue,
        user: user?.id ?? 0,
        vote_type: KeyFactorVoteTypes.STRENGTH,
      });

      sendAnalyticsEvent("KeyFactorVote", {
        event_category: "none",
        event_label: isNil(newValue) ? "null" : newValue.toString(),
        variant: "strength",
      });

      if (response) {
        const returned = response as unknown as KeyFactorVoteAggregate;
        setAggregate(returned);
        setKeyFactorVote(keyFactorId, returned);
      }
    } catch (e) {
      logError(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelect = (value: StrengthVoteOption) => {
    const next = aggregate.user_vote === value ? null : value;
    submitVote(next);
  };

  const voteOptions = [
    { value: StrengthValues.NO_IMPACT, label: t("noImpact") },
    { value: StrengthValues.LOW, label: t("lowStrength") },
    { value: StrengthValues.MEDIUM, label: t("mediumStrength") },
    { value: StrengthValues.HIGH, label: t("highStrength") },
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="w-full text-[10px] font-medium uppercase text-gray-500 dark:text-gray-500-dark">
        {t("vote")}
      </div>
      <div className="flex justify-between">
        <div className="flex w-full flex-wrap items-center gap-2">
          {voteOptions.map(({ value, label }) => (
            <button
              type="button"
              key={value}
              className={cn(
                "rounded-[4px] px-2 py-1.5 text-xs font-medium leading-none outline-none transition-colors",
                aggregate.user_vote === value
                  ? "border border-transparent bg-olive-800 text-gray-0 dark:bg-olive-800-dark dark:text-gray-0-dark"
                  : "border border-blue-400 text-blue-800 hover:bg-blue-100/50 dark:border-blue-400-dark dark:text-blue-800-dark dark:hover:bg-blue-100-dark/20"
              )}
              onClick={() => handleSelect(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {footerControls}
      </div>
    </div>
  );
};

const KeyFactorStrengthVoter: FC<Props> = ({
  keyFactorId,
  vote,
  className,
  allowVotes,
  mode = "forecaster",
  footerControls,
}) => {
  const { user } = useAuth();

  const [aggregate, setAggregate] = useState<KeyFactorVoteAggregate>(vote);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <StrengthScale
        score={aggregate?.score ?? 0}
        count={aggregate?.count ?? 0}
        mode={mode}
      />
      {user && allowVotes && (
        <VoterControls
          keyFactorId={keyFactorId}
          aggregate={aggregate}
          setAggregate={setAggregate}
          footerControls={footerControls}
        />
      )}
    </div>
  );
};

export default KeyFactorStrengthVoter;
