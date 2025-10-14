import { isNil } from "lodash";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { KeyFactorVoteAggregate, KeyFactorVoteTypes } from "@/types/comment";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

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

  const clamped = Math.max(0, Math.min(5, score ?? 0));
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex w-full justify-between">
        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
          {t("strength")}
        </div>
        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
          {t("votesWithCount", { count })}
        </div>
      </div>
      <div className="flex w-full gap-[1px]">
        {Array.from({ length: 5 }).map((_, i) => {
          const segmentFill = Math.max(0, Math.min(1, clamped - i));
          const widthPct = Math.round(segmentFill * 100);

          return (
            <div
              key={i}
              className="relative h-2.5 flex-1 rounded-[1px] bg-blue-400 dark:bg-blue-400-dark"
            >
              {widthPct > 0 && (
                <div
                  className="absolute inset-y-0 left-0 rounded-[1px] bg-olive-600 dark:bg-olive-600-dark"
                  style={{ width: `${widthPct}%` }}
                />
              )}
            </div>
          );
        })}
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
  const { setCurrentModal } = useModal();
  const { setKeyFactorVote } = useCommentsFeed();

  const [aggregate, setAggregate] = useState<KeyFactorVoteAggregate>(vote);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const submitVote = async (newValue: number | null) => {
    if (isSubmitting) return;
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await voteKeyFactor({
        id: keyFactorId,
        vote: newValue,
        user: user.id,
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
    { value: 0, label: t("noImpact") },
    { value: 1, label: t("low") },
    { value: 2, label: t("medium") },
    { value: 5, label: t("high") },
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <StrengthScale
        score={aggregate?.score ?? 0}
        count={aggregate?.count ?? 0}
      />
      <div className="flex flex-col gap-1.5">
        <div className="w-full text-xs font-medium uppercase text-gray-500 dark:text-gray-500-dark">
          {t("vote")}
        </div>
        <div className="flex w-full flex-wrap items-center gap-2">
          {voteOptions.map(({ value, label }) => (
            <Button
              key={value}
              variant={aggregate.user_vote === value ? "primary" : "tertiary"}
              size="xs"
              className={cn("rounded-[4px] px-2 py-1.5 font-medium", {
                "border-blue-400 text-blue-800 dark:border-blue-400-dark dark:text-blue-800-dark":
                  aggregate.user_vote !== value,
              })}
              onClick={() => handleSelect(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyFactorStrengthVoter;
