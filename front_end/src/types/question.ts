import { VoteDirection } from "@/types/votes";

export enum QuestionType {
  Numeric = "numeric",
  Date = "date",
  Binary = "binary",
  MultipleChoice = "multiple_choice",
}

export enum QuestionStatus {
  Resolved = "resolved",
  Closed = "closed",
  Active = "active",
}

export enum QuestionOrder {
  ActivityDesc = "-activity",
  WeeklyMovementDesc = "-weekly_movement",
  PublishTimeDesc = "-publish_time",
  LastPredictionTimeAsc = "last_prediction_time",
  LastPredictionTimeDesc = "-last_prediction_time",
  DivergenceDesc = "-divergence",
  VotesDesc = "-votes",
  CommentCountDesc = "-comment_count",
  UnreadCommentCountDesc = "-unread_comment_count",
  PredictionCountDesc = "-prediction_count",
  CloseTimeAsc = "close_time",
  ResolveTimeAsc = "resolve_time",
}

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

export type NumericForecast = {
  timestamps: number[];
  values_mean: number[];
  values_max: number[];
  values_min: number[];
  nr_forecasters: number[];
};

export type MultipleChoiceForecast = {
  timestamps: number[];
  nr_forecasters: number[];
  [value_choice_n: string]: any;
};

export type QuestionVote = {
  score: number;
  user_vote: VoteDirection;
};

export type Question = {
  id: number;
  projects: {
    category: Category[];
    topic: Topic[];
  };
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  approved_at: string | null;
  closed_at: string;
  resolved_at: string;
  type: QuestionType;
  possibilities: string; // TODO: update type
  resolution: string | null;
  author: number;
  approved_by: number | null;
  tags: string[];
  categories: string[];
  topics: string[];
  vote: QuestionVote;
  status: QuestionStatus;
  nr_forecasters: number;
  author_username: string;
};

export type QuestionWithNumericForecasts = Question & {
  type: QuestionType.Numeric | QuestionType.Date | QuestionType.Binary;
  forecasts: NumericForecast;
};
export type QuestionWithMultipleChoiceForecasts = Question & {
  type: QuestionType.MultipleChoice;
  forecasts: MultipleChoiceForecast;
};

export type QuestionWithForecasts =
  | QuestionWithNumericForecasts
  | QuestionWithMultipleChoiceForecasts;

export type ForecastData = {
  continuousCdf: number[];
  probabilityYes: number;
  probabilityYesPerCategory: number[];
};
