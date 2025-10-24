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

export type CommentOfWeekEntry = {
  votes_score: number;
  changed_my_mind_count: number;
  key_factor_votes_score: number;
  excluded: boolean;
  comment: BECommentType;
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
  STRENGTH = "strength",
}

export enum StrengthValues {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 5,
  NO_IMPACT = 0,
}

export type KeyFactorVoteType =
  (typeof KeyFactorVoteTypes)[keyof typeof KeyFactorVoteTypes];

export type StrengthVoteOption = 0 | 1 | 2 | 5;

// TODO: drop Legacy AB-test scores
type KeyFactorVoteA = -1 | 1 | null;
type KeyFactorVoteBAndC = -5 | -3 | -2 | 0 | 2 | 3 | 5;
export type KeyFactorVoteScore = KeyFactorVoteA | KeyFactorVoteBAndC;

export type KeyFactorVote = {
  vote_type: KeyFactorVoteType;
  score: KeyFactorVoteScore;
  show_second_step?: boolean; // used only for two step survey
  second_step_completed?: boolean; // used only for two step survey
};

export enum ImpactDirectionCategory {
  Increase,
  Decrease,
  More,
  Less,
  Earlier,
  Later,
  IncreaseUncertainty,
}

export type ImpactMetadata = {
  impact_direction: 1 | -1 | null;
  certainty: -1 | null;
};

export type Driver = ImpactMetadata & {
  text: string;
};

export type KeyFactor = {
  id: number;
  driver: Driver;
  author: AuthorType; // used to set limit per question
  comment_id: number;
  vote: KeyFactorVoteAggregate;
  question_id?: number | null;
  question?: {
    id: number;
    label: string;
    unit?: string | null;
  } | null;
  question_option?: string;
  freshness?: number;
  post: {
    id: number;
    unit?: string;
    question_type?: QuestionType;
  };
};

export type KeyFactorVoteAggregate = {
  // Aggregated strength score
  score: number;
  // Current user's vote
  user_vote: StrengthVoteOption | null;
  // Total number of votes
  count: number;
};

type DraftBase = {
  markdown: string;
  lastModified: number;
  userId: number;
};

export type CreateDraft = DraftBase & {
  kind: "create";
  postId: number;
  parentId?: number;
  includeForecast: boolean;
};

export type EditDraft = DraftBase & {
  kind: "edit";
  commentId: number;
  onPostId?: number;
  isPrivate?: boolean;
};

export type Draft = CreateDraft | EditDraft;
