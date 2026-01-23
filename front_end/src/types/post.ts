import { KeyFactor } from "@/types/comment";
import {
  Question,
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { VoteDirection } from "@/types/votes";

import {
  Category,
  Community,
  LeaderboardTag,
  NewsCategory,
  Tournament,
} from "./projects";

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
  condition: QuestionWithForecasts & { short_title: string };
  condition_child: QuestionWithForecasts & { short_title: string };
  question_yes: QT;
  question_no: QT;
};

export enum PostGroupOfQuestionsSubquestionsOrder {
  MANUAL = "MANUAL",
  CP_ASC = "CP_ASC",
  CP_DESC = "CP_DESC",
}

export enum GroupOfQuestionsGraphType {
  FanGraph = "fan_graph",
  MultipleChoiceGraph = "multiple_choice_graph",
}

export type PostGroupOfQuestions<QT> = {
  id: number;
  description: string;
  resolution_criteria: string;
  fine_print: string;
  group_variable: string;
  graph_type: GroupOfQuestionsGraphType;
  questions: QT[];
  subquestions_order?: PostGroupOfQuestionsSubquestionsOrder;
};

export type Notebook = {
  id: number;
  created_at: string;
  edited_at: string;
  markdown: string;
  image_url: string;
  feed_tile_summary: string;
};

export type PostPrivateNote = {
  text: string;
  updated_at: string;
};

type BasePost = {
  id: number;
  projects: {
    category?: Category[];
    topic: Topic[];
    default_project: Tournament;
    tournament?: Tournament[];
    question_series?: Tournament[];
    leaderboard_tag?: LeaderboardTag[];
    community?: Community[];
    index?: Tournament[];
    news_category?: NewsCategory[];
  };
  title: string;
  short_title: string;
  slug: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  curation_status_updated_at: string | null;
  actual_close_time: string;
  scheduled_close_time: string;
  scheduled_resolve_time: string;
  actual_resolve_time: string | null;
  open_time: string;
  vote: PostVote;
  nr_forecasters: number;
  author_username: string;
  coauthors: { id: number; username: string }[];
  author_id: number;
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
  private_note?: PostPrivateNote | null;
  key_factors?: KeyFactor[];
  html_metadata_json?: {
    title: string;
    description: string;
    image_url: string;
  };
};

export type QuestionPost<QT = Question> = BasePost & {
  question: QT;
  conditional?: never;
  group_of_questions?: never;
  notebook?: never;
};

export type ConditionalPost<
  QT extends Question | QuestionWithNumericForecasts = Question,
> = BasePost & {
  question?: never;
  conditional: PostConditional<QT>;
  group_of_questions?: never;
  notebook?: never;
};

export type GroupOfQuestionsPost<
  QT extends Question | QuestionWithNumericForecasts = Question,
> = BasePost & {
  question?: never;
  conditional?: never;
  group_of_questions: PostGroupOfQuestions<QT>;
  notebook?: never;
};

export type NotebookPost = BasePost & {
  question?: never;
  conditional?: never;
  group_of_questions?: never;
  notebook: Notebook;
};

export type Post<QT = Question> =
  | QuestionPost<QT>
  | ConditionalPost<
      QT extends Question | QuestionWithNumericForecasts ? QT : Question
    >
  | GroupOfQuestionsPost<
      QT extends Question | QuestionWithNumericForecasts ? QT : Question
    >
  | NotebookPost;

export type PostWithForecasts =
  | QuestionPost<QuestionWithForecasts>
  | ConditionalPost<QuestionWithNumericForecasts>
  | GroupOfQuestionsPost<QuestionWithNumericForecasts>
  | NotebookPost;

export type PredictionFlowPost = Pick<
  PostWithForecasts,
  "id" | "title" | "conditional" | "group_of_questions" | "question"
> & {
  isDone?: boolean;
};

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
