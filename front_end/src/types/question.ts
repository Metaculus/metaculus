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

export type BaseForecast = {
  timestamps: number[];
  nr_forecasters: number[];
  my_forecasts: number[][] | null;
  latest_pmf: number[] | null;
  latest_cdf: number[] | null;
};

export type NumericForecast = BaseForecast & {
  values_mean: number[];
  values_max: number[];
  values_min: number[];
};

export type MultipleChoiceForecast = BaseForecast & {
  [value_choice_n: string]: any;
};

export type Question = {
  id: number;
  title: string;
  min: number;
  max: number;
  description: string;
  created_at: string;
  updated_at: string;
  closed_at: string;
  resolved_at: string;
  type: QuestionType;
  possibilities: string; // TODO: update type
  resolution: string | null;
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
  continuousCdf: number[] | null;
  probabilityYes: number | null;
  probabilityYesPerCategory: number[] | null;
};
