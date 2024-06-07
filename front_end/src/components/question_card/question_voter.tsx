import { FC, useState } from "react";

import { voteQuestion } from "@/app/(main)/questions/actions";
import Voter from "@/components/voter";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Question } from "@/types/question";
import { VoteDirection } from "@/types/votes";

type Props = {
  className?: string;
  question: Question;
};

const QuestionVoter: FC<Props> = ({ className, question }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [vote, setVote] = useState(question.vote);
  const handleVote = async (direction: VoteDirection) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    const newDirection = vote.user_vote === direction ? null : direction;
    const response = await voteQuestion(question.id, newDirection);
    if ("score" in response) {
      setVote({ user_vote: newDirection, score: response.score });
    }
  };

  return (
    <Voter
      className={className}
      userVote={vote.user_vote}
      votes={vote.score}
      onVoteUp={() => handleVote(1)}
      onVoteDown={() => handleVote(-1)}
    />
  );
};

export default QuestionVoter;
