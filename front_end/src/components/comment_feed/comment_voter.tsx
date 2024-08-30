import { FC, useState } from "react";

import { voteComment } from "@/app/(main)/questions/actions";
import Voter from "@/components/voter";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { VoteDirection } from "@/types/votes";

type Props = {
  voteData: VoteData;
  className?: string;
};

type VoteData = {
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

    const newDirection = userVote === direction ? null : direction;
    const response = await voteComment({
      id: voteData.commentId,
      vote: newDirection,
      user: user.id,
    });
    if (response && "score" in response) {
      setUserVote(newDirection);
      setVoteScore(response.score as number);
    }
  };
  return (
    <Voter
      className={className}
      userVote={userVote}
      votes={voteScore}
      onVoteUp={() => handleVote(1)}
      onVoteDown={() => handleVote(-1)}
    />
  );
};

export default CommentVoter;
