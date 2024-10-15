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
  RankDesc = "-rank",
  CreatedDesc = "-created_at",
}

export type Scaling = {
  range_max: number | null;
  range_min: number | null;
  zero_point: number | null;
};

export enum AggregationMethod {
  recency_weighted = "recency_weighted",
  unweighted = "unweighted",
  single_aggregation = "single_aggregation",
  metaculus_prediction = "metaculus_prediction",
}

export const aggregationMethodsArray = [
  AggregationMethod.recency_weighted,
  AggregationMethod.unweighted,
  AggregationMethod.single_aggregation,
  AggregationMethod.metaculus_prediction,
];
export const aggregationMethodLabel = {
  recency_weighted: "Recency Weighted",
  unweighted: "Unweighted",
  single_aggregation: "Single Aggregation",
  metaculus_prediction: "Metaculus Prediction",
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

export type Forecast = {
  question_id: number;
  start_time: number;
  end_time: number | null;
  forecast_values: number[];
  interval_lower_bounds: number[] | null;
  centers: number[] | null;
  interval_upper_bounds: number[] | null;
};

export type ScoreData = {
  baseline_score?: number | null;
  peer_score?: number | null;
  spot_baseline_score?: number | null;
  spot_peer_score?: number | null;
  relative_legacy_score?: number | null;
  relative_legacy_arvhived_score?: number | null;
  coverage?: number | null;
  weighted_coverage?: number | null;
};

export type SliderLocations = {
  left: number;
  center: number;
  right: number;
};

export type SliderValues = {
  weights: number[];
  forecast: SliderLocations[];
};

export type UserForecast = Forecast & {
  slider_values: SliderValues | null;
};

export type UserForecastHistory = {
  history: UserForecast[];
  latest?: UserForecast;
  score_data?: ScoreData;
};

export type AggregateForecast = Forecast & {
  method: AggregationMethod;
  forecaster_count: number;
  means: number[] | null;
  histogram: number[] | null;
  forecast_values: number[] | null;
};

export type AggregateForecastHistory = {
  history: AggregateForecast[];
  latest?: AggregateForecast;
  score_data?: ScoreData;
};

export type Aggregations = {
  recency_weighted: AggregateForecastHistory;
  unweighted?: AggregateForecastHistory;
  single_aggregation?: AggregateForecastHistory;
  metaculus_prediction?: AggregateForecastHistory;
};

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
  means: number[];
  latest_pmf: number[];
  latest_cdf: number[];
  histogram?: number[];
};

export type MultipleChoiceForecast = BaseForecast & {
  [value_choice_n: string]: Array<{
    median: number;
    q3: number;
    q1: number;
  }>;
};

export type Question = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  open_time?: string;
  scheduled_resolve_time: string;
  actual_resolve_time?: string;
  resolution_set_time?: string;
  scheduled_close_time: string;
  actual_close_time?: string;
  type: QuestionType;
  options?: string[];
  scaling: Scaling;
  possibilities: {
    format?: string;
    high?: string;
    low?: string;
    type?: string;
    scale?: {
      max: number;
      min: number;
      deriv_ratio: number;
    };
  }; // TODO: update type
  resolution: Resolution | null;
  fine_print: string | null;
  resolution_criteria: string | null;
  label: string | null;
  nr_forecasters: number;
  author_username: string;
  post_id: number;
  display_divergences?: number[][];
  aggregations: Aggregations;
  my_forecasts?: UserForecastHistory;
  // Used for GroupOfQuestions
  is_open?: boolean;
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
  probabilityYesPerCategory: Record<string, number> | null;
};

export type PredictionInputMessage =
  | "predictionUpcomingMessage"
  | "predictionUnapprovedMessage"
  | "predictionClosedMessage"
  | null;

export type AggregationQuestion = {
  actual_close_time: string | null;
  actual_resolve_time: string | null;
  aggregations: Aggregations;
  created_at: string;
  description: string;
  fine_print: string;
  id: number;
  label: string | null;
  open_lower_bound: boolean | null;
  open_time: string;
  open_upper_bound: boolean | null;
  options: string[] | null;
  possibilities: {
    format?: string;
    high?: string;
    low?: string;
    type?: string;
    scale?: {
      max: number;
      min: number;
      deriv_ratio: number;
    };
  };
  post_id: number;
  resolution: string | null;
  resolution_criteria: string;
  resolution_set_time: string | null;
  scaling: Scaling;
  scheduled_close_time: string;
  scheduled_resolve_time: string;
  title: string;
  type: QuestionType;
};
