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
  PublishTimeDesc = "-published_at",
  LastPredictionTimeAsc = "user_last_forecasts_date",
  LastPredictionTimeDesc = "-user_last_forecasts_date",
  DivergenceDesc = "-divergence",
  VotesDesc = "-vote_score",
  CommentCountDesc = "-comment_count",
  UnreadCommentCountDesc = "-unread_comment_count",
  PredictionCountDesc = "-forecasts_count",
  CloseTimeAsc = "scheduled_close_time",
  ScoreDesc = "-score",
  ScoreAsc = "score",
  ResolveTimeAsc = "scheduled_resolve_time",
  HotDesc = "-hotness",
  HotAsc = "hotness",
}

export type BaseForecast = {
  timestamps: number[];
  nr_forecasters: number[];
  my_forecasts: {
    timestamps: number[];
    medians: number[];
    slider_values: any | null;
  } | null;
};

export type NumericForecast = BaseForecast & {
  medians: number[];
  q3s: number[];
  q1s: number[];
  latest_pmf: number[];
  latest_cdf: number[];
};

export type MultipleChoiceForecast = BaseForecast & {
  [value_choice_n: string]: Array<{
    median: number;
    q3: number;
    q1: number;
  }>;
};
export type Bounds = {
  belowLower: number;
  aboveUpper: number;
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
  range_min: number;
  range_max: number;
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
  fine_print: string | null;
  resolution_criteria_description: string | null;
  label: string | null;
  nr_forecasters: number;
  author_username: string;
  zero_point: number | null;
  post_id?: number;
  display_divergences?: number[][];
};

export type QuestionWithNumericForecasts = Question & {
  type: QuestionType.Numeric | QuestionType.Date | QuestionType.Binary;
  forecasts: NumericForecast;
  open_lower_bound?: boolean;
  open_upper_bound?: boolean;
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
