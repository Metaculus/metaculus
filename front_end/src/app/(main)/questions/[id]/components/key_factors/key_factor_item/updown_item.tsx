"use client";
import { FC } from "react";

import KeyFactorVoter from "@/app/(main)/questions/[id]/components/key_factors/key_factor_voter";
import { KeyFactor, KeyFactorVoteTypes } from "@/types/comment";
import cn from "@/utils/core/cn";

import KeyFactorText from "./key_factor_text";

type Props = {
  keyFactor: KeyFactor;
  linkToComment?: boolean;
  linkAnchor: string;
  variant?: "default" | "compact";
};

export const UpdownKeyFactorItem: FC<Props> = ({
  keyFactor: { text, id, votes_score, user_votes },
  linkToComment = true,
  linkAnchor,
  variant = "default",
}) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center gap-3 rounded border border-transparent bg-blue-200 p-3 hover:border-blue-500 dark:bg-blue-200-dark dark:hover:border-blue-500-dark xs:flex-row [&:hover_.target]:visible",
        { "bg-gray-0 dark:bg-gray-0-dark": linkToComment },
        variant === "compact" ? "flex-row" : "flex-col"
      )}
    >
      <KeyFactorVoter
        className="z-10 shrink-0"
        voteData={{
          keyFactorId: id,
          votesScore: votes_score,
          userVote:
            user_votes.findLast(
              (vote) => vote.vote_type === KeyFactorVoteTypes.UP_DOWN
            ) ?? null,
        }}
      />
      <KeyFactorText
        text={text}
        linkAnchor={variant === "compact" ? undefined : linkAnchor}
        linkToComment={linkToComment}
        className={
          variant === "compact"
            ? "text-left text-gray-800 dark:text-gray-800-dark"
            : undefined
        }
      />
    </div>
  );
};

export default UpdownKeyFactorItem;
