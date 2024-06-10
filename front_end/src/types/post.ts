import { Question, QuestionWithForecasts } from "@/types/question";
import { VoteDirection } from "@/types/votes";

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

export type Topic = {
  id: number;
  name: string;
  slug: string;
  description: string;
  emoji: string;
};

export type PostVote = {
  score: number;
  user_vote: VoteDirection;
};

export type Post<QT = Question> = {
  id: number;
  projects: {
    category: Category[];
    topic: Topic[];
  };
  title: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  approved_at: string | null;
  vote: PostVote;
  nr_forecasters: number;
  author_username: string;
  author_id: number;
  question: QT;
};

export type PostWithForecasts = Post<QuestionWithForecasts>;
