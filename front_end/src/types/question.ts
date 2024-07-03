import { Resolution } from "@/types/post";

export enum QuestionType {
  Numeric = "numeric",
  Date = "date",
  Binary = "binary",
  MultipleChoice = "multiple_choice",
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
  my_forecasts: {
    timestamps: number[];
    values_mean: number[];
    slider_values: any | null;
  } | null;
};

export type NumericForecast = BaseForecast & {
  values_mean: number[];
  values_max: number[];
  values_min: number[];
  latest_pmf: number[];
  latest_cdf: number[];
};

export type MultipleChoiceForecast = BaseForecast & {
  [value_choice_n: string]: Array<{
    value_mean: number;
    value_max: number;
    value_min: number;
  }>;
};

export type Quartiles = {
  median: number;
  lower25: number;
  upper75: number;
};
export type ExtendedQuartiles = Quartiles & {
  lower10: number;
  upper90: number;
};

export type Question = {
  id: number;
  title: string;
  min: number;
  max: number;
  description: string;
  created_at: string;
  updated_at: string;
  open_time?: string;
  scheduled_resolve_time: string;
  actual_resolve_time?: string;
  resolution_set_time?: string;
  scheduled_close_time: string;
  actual_close_time?: string;
  forecast_scoring_ends?: string;
  type: QuestionType;
  options?: string[];
  possibilities: string; // TODO: update type
  resolution: Resolution | null;
  nr_forecasters: number;
  author_username: string;
  zero_point: number;
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
