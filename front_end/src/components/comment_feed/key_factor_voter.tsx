"use client";
import { sendGAEvent } from "@next/third-parties/google";
import { FC, useEffect, useState } from "react";

import { useCommentsFeed } from "@/app/(main)/components/comments_feed_provider";
import { voteKeyFactor } from "@/app/(main)/questions/actions";
import Voter from "@/components/voter";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { KeyFactorVote } from "@/types/comment";
import { VoteDirection } from "@/types/votes";
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

// TODO: refactore it for new key factor variants
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
      if (newScore === 1) sendGAEvent("event", "KeyFactorUpvote");
      if (newScore === -1) sendGAEvent("event", "KeyFactorDownvote");

      if (response && "score" in response) {
        const newVotesScore = response.score as number;

        setKeyFactorVote(voteData.keyFactorId, vote, newVotesScore);

        setUserVote(vote);
        setVotesScore(newVotesScore);
      }
    } catch (e) {
      logError(e);
    }
  };
  return (
    <Voter
      className={className}
      userVote={userVote?.score as VoteDirection}
      votes={votesScore}
      onVoteUp={() => handleVote({ vote_type: "a_updown", score: 1 })} // TODO: refactor it for new key factor variants
      onVoteDown={() => handleVote({ vote_type: "a_updown", score: -1 })}
      commentArea={true}
    />
  );
};

export default KeyFactorVoter;
