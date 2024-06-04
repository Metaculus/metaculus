import { FC } from "react";

import { voteQuestion } from "@/app/questions/actions";
import Voter from "@/components/voter";
import { Question } from "@/types/question";
import { VoteDirection } from "@/types/votes";

type Props = {
  className?: string;
  question: Question;
};

const QuestionVoter: FC<Props> = ({ className, question }) => {
  const handleVote = async (direction: VoteDirection) => {
    const newDirection =
      question.vote.user_vote === direction ? null : direction;
    await voteQuestion(question.id, newDirection);
  };

  return (
    <Voter
      className={className}
      userVote={question.vote.user_vote}
      votes={question.vote.score}
      onVoteUp={() => handleVote("up")}
      onVoteDown={() => handleVote("down")}
    />
  );
};

export default QuestionVoter;
