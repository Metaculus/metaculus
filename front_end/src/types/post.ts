import { KeyFactor } from "@/types/comment";
import {
  Question,
  QuestionType,
  QuestionWithForecasts,
} from "@/types/question";
import { VoteDirection } from "@/types/votes";

import { Community, Tournament } from "./projects";

export type Resolution =
  | "yes"
  | "no"
  | "below_lower_bound"
  | "above_upper_bound"
  | number
  | string;

export enum PostForecastType {
  Conditional = "conditional",
  Group = "group_of_questions",
}

export enum ProjectPermissions {
  VIEWER = "viewer",
  FORECASTER = "forecaster",
  CURATOR = "curator",
  ADMIN = "admin",
  CREATOR = "creator",
}

export enum NotebookType {
  Notebook = "notebook",
}

export type ForecastType = PostForecastType | QuestionType | NotebookType;

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
  is_global_leaderboard: boolean;
};

export type Topic = {
  id: number;
  name: string;
  slug: string;
  description: string;
  emoji: string;
};

export type PostVote = {
  score: number | null;
  user_vote: VoteDirection;
};

export enum QuestionStatus {
  UPCOMING = "upcoming",
  OPEN = "open",
  CLOSED = "closed",
  RESOLVED = "resolved",
}

export enum PostStatus {
  DRAFT = "draft",
  PENDING = "pending",
  REJECTED = "rejected",
  APPROVED = "approved",
  OPEN = "open",
  UPCOMING = "upcoming",
  CLOSED = "closed",
  PENDING_RESOLUTION = "pending_resolution",
  RESOLVED = "resolved",
  DELETED = "deleted",
}

export type PostConditional<QT> = {
  id: number;
  title: string;
  condition: QuestionWithForecasts;
  condition_child: QuestionWithForecasts;
  question_yes: QT;
  question_no: QT;
};

export type PostGroupOfQuestions<QT> = {
  id: number;
  description: string;
  resolution_criteria: string;
  fine_print: string;
  group_variable: string;
  graph_type: string;
  questions: QT[];
};

export type Notebook = {
  id: number;
  created_at: string;
  edited_at: string;
  markdown: string;
  type: string;
  image_url: string;
};

export type Post<QT = Question> = {
  id: number;
  projects: {
    category?: Category[];
    topic: Topic[];
    default_project: Tournament;
    tournament?: Tournament[];
    question_series?: Tournament[];
    tag?: Tag[];
    community?: Community[];
    index?: Tournament[];
  };
  title: string;
  url_title: string;
  slug: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  curation_status_updated_at: string | null;
  actual_close_time: string;
  scheduled_close_time: string;
  scheduled_resolve_time: string;
  open_time: string;
  vote: PostVote;
  nr_forecasters: number;
  author_username: string;
  coauthors: { id: number; username: string }[];
  author_id: number;
  question?: QT;
  conditional?: PostConditional<QT>;
  group_of_questions?: PostGroupOfQuestions<QT>;
  notebook?: Notebook;
  curation_status: PostStatus;
  status: PostStatus;
  resolved: boolean;
  user_permission: ProjectPermissions;
  comment_count?: number;
  forecasts_count?: number;
  subscriptions?: Array<PostSubscription & { created_at: string }>;
  unread_comment_count?: number;
  last_viewed_at?: string;
  is_current_content_translated?: boolean;
  key_factors?: KeyFactor[];
};

export type QuestionPost<QT = Question> = Post<QT> & {
  question: QT;
};
export type ConditionalPost<QT = Question> = Post<QT> & {
  conditional: PostConditional<QT>;
};
export type GroupOfQuestionsPost<QT = Question> = Post<QT> & {
  group_of_questions: PostGroupOfQuestions<QT>;
};
export type NotebookPost = Omit<Post, "notebook"> & {
  notebook: Notebook;
};

export type PostWithForecasts = Post<QuestionWithForecasts>;

export enum PostSubscriptionType {
  CP_CHANGE = "cp_change",
  NEW_COMMENTS = "new_comments",
  MILESTONE = "milestone",
  STATUS_CHANGE = "status_change",
  SPECIFIC_TIME = "specific_time",
}

export enum CPChangeThreshold {
  LARGE = 0.6,
  MEDIUM = 0.25,
  SMALL = 0.05,
}

export type PostSubscription =
  | PostSubscriptionNewComments
  | PostSubscriptionMilestone
  | PostSubscriptionStatusChange
  | PostSubscriptionSpecificTime
  | PostSubscriptionCPCHange;

export type PostSubscriptionConfigItem =
  | PostSubscriptionNewComments
  | PostSubscriptionMilestone
  | PostSubscriptionStatusChange
  | PostSubscriptionCPCHange
  | PostSubscriptionSpecificTimeConfig;

export type PostSubscriptionNewComments = {
  id?: number;
  type: PostSubscriptionType.NEW_COMMENTS;
  comments_frequency: number;
};

export type PostSubscriptionMilestone = {
  id?: number;
  type: PostSubscriptionType.MILESTONE;
  milestone_step: number;
};

export type PostSubscriptionStatusChange = {
  id?: number;
  type: PostSubscriptionType.STATUS_CHANGE;
};

export type PostSubscriptionCPCHange = {
  id?: number;
  type: PostSubscriptionType.CP_CHANGE;
  cp_change_threshold: CPChangeThreshold;
};

export type PostSubscriptionSpecificTime = {
  id?: number;
  type: PostSubscriptionType.SPECIFIC_TIME;
  next_trigger_datetime: string;
  recurrence_interval: string;
};

export type PostSubscriptionSpecificTimeConfig = {
  type: PostSubscriptionType.SPECIFIC_TIME;
  subscriptions: PostSubscriptionSpecificTime[];
};
