"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { FC, useEffect, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import Voter from "@/components/voter";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { VoteDirection } from "@/types/votes";
import { logError } from "@/utils/errors";

type Props = {
  voteData: VoteData;
  className?: string;
};

type VoteData = {
  keyFactorId: number;
  votesScore?: number | null;
  userVote: VoteDirection;
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

  const handleVote = async (direction: VoteDirection) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    try {
      const newDirection = userVote === direction ? null : direction;
      const response = await voteKeyFactor({
        id: voteData.keyFactorId,
        vote: newDirection,
        user: user.id,
      });
      if (newDirection === 1) sendGAEvent("event", "KeyFactorUpvote");
      if (newDirection === -1) sendGAEvent("event", "KeyFactorDownvote");

      if (response && "score" in response) {
        const newVotesScore = response.score as number;

        setKeyFactorVote(voteData.keyFactorId, newDirection, newVotesScore);

        setUserVote(newDirection);
        setVotesScore(newVotesScore);
      }
    } catch (e) {
      logError(e);
    }
  };
  return (
    <Voter
      className={className}
      userVote={userVote}
      votes={votesScore}
      onVoteUp={() => handleVote(1)}
      onVoteDown={() => handleVote(-1)}
      commentArea={true}
    />
  );
};

export default KeyFactorVoter;
