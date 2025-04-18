"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { isNil } from "lodash";
import { FC, useEffect, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import Voter from "@/components/voter";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { KeyFactorVote, KeyFactorVoteTypes } from "@/types/comment";
import { VoteDirection } from "@/types/votes";
import cn from "@/utils/cn";
import { logError } from "@/utils/errors";

type Props = {
  voteData: VoteData;
  className?: string;
};

type VoteData = {
  keyFactorId: number;
  votesScore?: number | null;
  userVote: KeyFactorVote | null;
};

const KeyFactorVoter: FC<Props> = ({ voteData, className }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [userVote, setUserVote] = useState(voteData.userVote);
  const [votesScore, setVotesScore] = useState(voteData.votesScore);
  const { setKeyFactorVote } = useCommentsFeed();

  // Update local state when voteData changes
  useEffect(() => {
    setUserVote(voteData.userVote);
    setVotesScore(voteData.votesScore);
  }, [voteData.userVote, voteData.votesScore]);

  const handleVote = async (vote: KeyFactorVote) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    try {
      const newScore = userVote?.score === vote.score ? null : vote.score;
      const response = await voteKeyFactor({
        id: voteData.keyFactorId,
        vote: newScore,
        user: user.id,
        vote_type: vote.vote_type,
      });

      sendGAEvent("event", "KeyFactorVote", {
        event_category: "none",
        event_label: isNil(newScore) ? "null" : newScore.toString(),
      });

      if (response && "score" in response) {
        const newVotesScore = response.score as number;

        setKeyFactorVote(
          voteData.keyFactorId,
          { ...vote, score: newScore },
          newVotesScore
        );

        setUserVote({ ...vote, score: newScore });
        setVotesScore(newVotesScore);
      }
    } catch (e) {
      logError(e);
    }
  };
  return (
    <Voter
      className={cn("rounded", className)}
      userVote={userVote?.score as VoteDirection}
      votes={votesScore}
      onVoteUp={() =>
        handleVote({ vote_type: KeyFactorVoteTypes.UP_DOWN, score: 1 })
      }
      onVoteDown={() =>
        handleVote({ vote_type: KeyFactorVoteTypes.UP_DOWN, score: -1 })
      }
      commentArea={true}
      upChevronClassName="h-2.5 w-2.5 rounded-bl-[3px] rounded-tl-[3px] p-1.5"
      downChevronClassName="h-2.5 w-2.5 rounded-br-[3px] rounded-tr-[3px] p-1.5"
    />
  );
};

export default KeyFactorVoter;
