"use client";
import { FC, useState } from "react";

import { votePost } from "@/app/(main)/questions/actions";
import Voter from "@/components/voter";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { Post } from "@/types/post";
import { VoteDirection } from "@/types/votes";

type Props = {
  className?: string;
  post: Post;
};

const PostVoter: FC<Props> = ({ className, post }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();

  const [vote, setVote] = useState(post.vote);
  const handleVote = async (direction: VoteDirection) => {
    if (!user) {
      setCurrentModal({ type: "signin" });
      return;
    }

    const newDirection = vote.user_vote === direction ? null : direction;
    const response = await votePost(post.id, newDirection);
    if ("score" in response) {
      setVote({ user_vote: newDirection, score: response.score });
    }
  };
  return (
    <Voter
      className={className}
      userVote={vote.user_vote}
      votes={vote.score ? vote.score : 0}
      onVoteUp={() => handleVote(1)}
      onVoteDown={() => handleVote(-1)}
    />
  );
};

export default PostVoter;
