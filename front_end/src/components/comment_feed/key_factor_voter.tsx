"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { FC, useState } from "react";

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
      sendGAEvent("event", "commentVoted");
      if (response && "score" in response) {
        setUserVote(newDirection);
        setVotesScore(response.score as number);
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
