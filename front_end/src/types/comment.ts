import { QuestionType } from "@/types/question";
import { VoteDirection } from "@/types/votes";

export type AuthorType = {
  id: number;
  is_bot: boolean;
  is_staff: boolean;
  username: string;
};

export type CommentType = {
  id: number;
  author: AuthorType; // double-check this type
  on_post: number;
  parent?: {
    id: number;
    on_post: number;
    author: {
      id: number;
      username: string;
    };
  };
  created_at: string;
  is_soft_deleted: boolean;
  text: string;
  included_forecast?: ForecastType;
  is_private: boolean;
  vote_score?: number;
  user_vote: VoteDirection;
  children: CommentType[];
  changed_my_mind: {
    for_this_user: boolean;
    count: number;
  };
};

export type ForecastType = {
  start_time: Date;
  probability_yes: number;
  probability_yes_per_category: number[];
  options: string[];
  continuous_cdf: number[];
  quartiles: number[];
  question_type: QuestionType;
};

export enum CommentPermissions {
  VIEWER = "VIEWER",
  CURATOR = "CURATOR",
  CREATOR = "CREATOR",
}
