import { ProjectPermissions } from "@/types/post";
import { QuestionType, Scaling } from "@/types/question";
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
  author_staff_permission: ProjectPermissions | null;
  on_post: number;
  root_id: number | null;
  parent_id: number | null;
  created_at: string;
  text_edited_at: string;
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
  key_factors?: KeyFactor[];
  is_pinned: boolean;
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
  quartiles: [number, number, number];
  scaling: Scaling;
  question_type: QuestionType;
};

export type KeyFactor = {
  id: number;
  text: string;
  comment_id: string;
  user_vote: VoteDirection | null;
  votes_score: number;
};
