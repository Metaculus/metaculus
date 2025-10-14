import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import React, {
  ButtonHTMLAttributes,
  FC,
  PropsWithChildren,
  useState,
} from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import { useAuth } from "@/contexts/auth_context";
import {
  KeyFactorVoteAggregate,
  KeyFactorVoteTypes,
  StrengthValues,
} from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import { SegmentedProgressBar } from "./segmented_progress_bar";

type Props = {
  keyFactorId: number;
  vote: KeyFactorVoteAggregate;
  className?: string;
  onVoteSuccess?: (newScore: number, newUserVote: number | null) => void;
};

const StrengthScale: FC<{ score: number; count: number }> = ({
  score,
  count,
}) => {
  const t = useTranslations();

  const clamped = Math.max(0, Math.min(5, score ?? 0)) / 5;
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full justify-between">
        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
          {t("strength")}
        </div>
        <div className="text-[10px] uppercase text-blue-700 dark:text-blue-700-dark">
          {t("votesWithCount", { count })}
        </div>
      </div>
      <div className="flex w-full gap-[1px]">
        <SegmentedProgressBar progress={clamped} segments={5} />
      </div>
    </div>
  );
};

const KeyFactorStrengthVoter: FC<Props> = ({
  keyFactorId,
  vote,
  className,
  onVoteSuccess,
}) => {
  const t = useTranslations();
  const { user } = useAuth();
  const { setKeyFactorVote } = useCommentsFeed();

  const [aggregate, setAggregate] = useState<KeyFactorVoteAggregate>(vote);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitVote = async (newValue: number | null) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
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
        onVoteSuccess?.(returned.score, returned.user_vote);
      }
    } catch (e) {
      logError(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelect = (value: number) => {
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
    <div className={cn("flex flex-col gap-3", className)}>
      <StrengthScale
        score={aggregate?.score ?? 0}
        count={aggregate?.count ?? 0}
      />
      {user && (
        <div className="flex flex-col gap-1.5">
          <div className="w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
            {t("vote")}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            {voteOptions.map(({ value, label }) => (
              <KFButton
                key={value}
                selected={aggregate.user_vote === value}
                onClick={() => handleSelect(value)}
              >
                {label}
              </KFButton>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyFactorStrengthVoter;

type KFButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }
>;

const KFButton: FC<KFButtonProps> = ({
  selected,
  className,
  children,
  ...rest
}) => {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "rounded-[4px] px-2 py-1.5 text-xs font-medium leading-none outline-none transition-colors",
        selected
          ? "border border-transparent bg-olive-800 text-gray-0 dark:bg-olive-800-dark dark:text-gray-0-dark"
          : "border border-blue-400 text-blue-800 hover:bg-blue-100/50 dark:border-blue-400-dark dark:text-blue-800-dark dark:hover:bg-blue-100-dark/20",
        className
      )}
    >
      {children}
    </button>
  );
};
