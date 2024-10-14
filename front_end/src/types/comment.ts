import { Post } from "@/types/post";
import { QuestionType } from "@/types/question";
import { VoteDirection } from "@/types/votes";

export type AuthorType = {
  id: number;
  username: string;
  is_bot: boolean;
  is_staff: boolean;
};

export type BECommentType = {
  id: number;
  author: AuthorType;
  on_post: number;
  root_id: number | null;
  parent_id: number | null;
  created_at: string;
  is_soft_deleted: boolean;
  text: string;
  included_forecast?: ForecastType;
  is_private: boolean;
  vote_score?: number;
  user_vote: VoteDirection;
  changed_my_mind: {
    for_this_user: boolean;
    count: number;
  };
  mentioned_users: AuthorType[];
  on_post_data?: {
    id: number;
    title: string;
  };
  is_current_content_translated?: boolean;
};

export type CommentType = BECommentType & {
  children: CommentType[];
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
