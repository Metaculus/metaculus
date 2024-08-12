"use client";
import { FC, useState } from "react";

import Voter from "@/components/voter";
import { NewsArticle } from "@/types/news";
import { VoteDirection } from "@/types/votes";

type Props = {
  article: NewsArticle;
  questionId: number;
};

const NewsArticleVoteButtons: FC<Props> = ({
  questionId, // will be used in api request
  article: initialArticle,
}) => {
  const [article, setArticle] = useState(initialArticle);
  async function voteSubmit(value: 1 | -1) {
    // if already voted, toggle to "not voted"
    const vote = article.user_vote === value ? null : value;

    const response = await Promise.resolve({ ok: true });
    if (!response.ok) return;
    setArticle({ ...article, user_vote: vote });
  }

  return (
    <Voter
      className="flex-col gap-0.5"
      onVoteUp={() => voteSubmit(1)}
      onVoteDown={() => voteSubmit(-1)}
      userVote={article.user_vote ?? 0}
    />
  );
};

export default NewsArticleVoteButtons;
