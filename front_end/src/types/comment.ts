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

export type CommentOfWeekType = BECommentType & {
  excluded: boolean;
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
  question_unit?: string;
};

export enum KeyFactorVoteTypes {
  UP_DOWN = "a_updown",
  TWO_STEP = "b_2step",
  LIKERT = "c_likert",
}

export enum ImpactValues {
  LOW = 2,
  MEDIUM = 3,
  HIGH = 5,
  LOW_NEGATIVE = -2,
  MEDIUM_NEGATIVE = -3,
  HIGH_NEGATIVE = -5,
  NO_IMPACT = 0,
}

export type KeyFactorVoteType =
  (typeof KeyFactorVoteTypes)[keyof typeof KeyFactorVoteTypes];

type KeyFactorVoteA = -1 | 1 | null;
type KeyFactorVoteBAndC = -5 | -3 | -2 | 0 | 2 | 3 | 5;
export type KeyFactorVoteScore = KeyFactorVoteA | KeyFactorVoteBAndC;

export type KeyFactorVote = {
  vote_type: KeyFactorVoteType;
  score: KeyFactorVoteScore;
  show_second_step?: boolean; // used only for two step survey
  second_step_completed?: boolean; // used only for two step survey
};

export type KeyFactor = {
  id: number;
  text: string;
  author: AuthorType; // used to set limit per question
  comment_id: number;
  user_votes: KeyFactorVote[]; // empty array if the user has not voted
  vote_type: KeyFactorVoteType | null; // null if the user has not voted
  votes_score: number;
  votes_count: number;
};

export type CommentDraft = {
  markdown: string;
  includeForecast: boolean;
  lastModified: number;
  postId: number;
  userId: number;
  parentId?: number;
};
