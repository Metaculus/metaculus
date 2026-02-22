"use client";
import { FC, useState } from "react";

import { voteComment } from "@/app/(main)/questions/actions";
import Voter from "@/components/voter";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { VoteDirection } from "@/types/votes";
import { sendAnalyticsEvent } from "@/utils/analytics";
import { logError } from "@/utils/core/errors";

type Props = {
  voteData: VoteData;
  className?: string;
};

type VoteData = {
  commentAuthorId: number;
  commentId: number;
  voteScore?: number | null;
  userVote: VoteDirection;
};

const CommentVoter: FC<Props> = ({ voteData, className }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [userVote, setUserVote] = useState(voteData.userVote);
  const [voteScore, setVoteScore] = useState(voteData.voteScore);
  const handleVote = async (direction: VoteDirection) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    try {
      const newDirection = userVote === direction ? null : direction;
      const response = await voteComment({
        id: voteData.commentId,
        vote: newDirection,
        user: user.id,
      });
      sendAnalyticsEvent("commentVoted");
      if (response && "score" in response) {
        setUserVote(newDirection);
        setVoteScore(response.score as number);
      }
    } catch (e) {
      logError(e);
    }
  };
  return (
    <Voter
      className={className}
      userVote={userVote}
      votes={voteScore}
      onVoteUp={() => handleVote(1)}
      onVoteDown={() => handleVote(-1)}
      commentArea={true}
      disabled={user?.is_bot || user?.id === voteData.commentAuthorId}
    />
  );
};

export default CommentVoter;
