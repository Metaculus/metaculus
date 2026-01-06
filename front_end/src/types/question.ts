import { ContinuousQuestionTypes } from "@/constants/questions";
import {
  FetchedAggregateCoherenceLinks,
  FetchedCoherenceLinks,
} from "@/types/coherence";
import { QuestionStatus, Resolution } from "@/types/post";
import { Category } from "@/types/projects";

import { ContinuousForecastInputType } from "./charts";
import { ScoreType } from "./scoring";

export const DefaultInboundOutcomeCount = 200;

export enum QuestionType {
  Binary = "binary",
  MultipleChoice = "multiple_choice",
  Numeric = "numeric",
  Discrete = "discrete",
  Date = "date",
}

export type ContinuousQuestionType = (typeof ContinuousQuestionTypes)[number];
export type SimpleQuestionType = Exclude<
  QuestionType,
  QuestionType.MultipleChoice
>;
export type QuestionLinearGraphType = "binary" | "continuous";

export enum QuestionOrder {
  ActivityDesc = "-activity",
  WeeklyMovementDesc = "-weekly_movement",
  PublishTimeDesc = "-published_at",
  OpenTimeDesc = "-open_time",
  LastPredictionTimeAsc = "user_last_forecasts_date",
  LastPredictionTimeDesc = "-user_last_forecasts_date",
  UserNextWithdrawTimeAsc = "user_next_withdraw_time",
  DivergenceDesc = "-divergence",
  VotesDesc = "-vote_score",
  CommentCountDesc = "-comment_count",
  UnreadCommentCountDesc = "-unread_comment_count",
  PredictionCountDesc = "-forecasts_count",
  ForecastersCountDesc = "-forecasters_count",
  CloseTimeAsc = "scheduled_close_time",
  ScoreDesc = "-score",
  ScoreAsc = "score",
  ResolveTimeAsc = "scheduled_resolve_time",
  NewsHotness = "-news_hotness",
  HotDesc = "-hotness",
  HotAsc = "hotness",
  RankDesc = "-rank",
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

export enum DownloadAggregationMethod {
  recency_weighted = AggregationMethod.recency_weighted,
  unweighted = AggregationMethod.unweighted,
  single_aggregation = AggregationMethod.single_aggregation,
  metaculus_prediction = AggregationMethod.metaculus_prediction,
  geometric_mean = "geometric_mean",
}

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
  relative_legacy_archived_score?: number | null;
  coverage?: number | null;
  weighted_coverage?: number | null;
};

export type DistributionInput<T> = {
  type: string;
  components: T[];
};

export type DistributionSliderComponent = {
  weight: number;
  left: number;
  center: number;
  right: number;
};

export enum Quantile {
  lower = "below_lower_bound",
  upper = "above_upper_bound",
  q1 = 25,
  q2 = 50,
  q3 = 75,
}

export type QuantileValue = {
  quantile: Quantile;
  value?: number; // quantile value or out of bounds value
  isDirty?: boolean;
};

export type DistributionQuantileComponent = QuantileValue[];

export type DistributionSlider =
  DistributionInput<DistributionSliderComponent> & {
    type: ContinuousForecastInputType.Slider;
  };

export type DistributionQuantile = {
  components: DistributionQuantileComponent;
  type: ContinuousForecastInputType.Quantile;
};

export type UserForecast = Forecast & {
  distribution_input: DistributionSlider | DistributionQuantile | null;
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
  histogram: number[][] | null;
  forecast_values: number[] | null;
};

export type AggregateForecastHistory = {
  history: AggregateForecast[];
  latest?: AggregateForecast;
  score_data?: ScoreData;
  movement?: CPMovement | null;
};

export type Aggregations = {
  recency_weighted: AggregateForecastHistory;
  unweighted: AggregateForecastHistory;
  single_aggregation: AggregateForecastHistory;
  metaculus_prediction: AggregateForecastHistory;
};

export type BaseForecast = {
  timestamps: number[];
  nr_forecasters: number[];
  my_forecasts: {
    timestamps: number[];
    medians: number[];
    distribution_input: unknown | null;
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

export type CPMovement = {
  divergence?: number;
  direction: MovementDirection;
  movement: number;
  period?: string;
};

export type GraphingQuestionProps = {
  scaling: Scaling;
  resolution?: Resolution | null;
  type: QuestionType;
  unit?: string;
  open_lower_bound?: boolean;
  open_upper_bound?: boolean;
  inbound_outcome_count?: number | null;
};

export type Question = {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  open_time?: string;
  cp_reveal_time?: string;
  spot_scoring_time?: string;
  scheduled_resolve_time: string;
  actual_resolve_time?: string;
  resolution_set_time?: string;
  scheduled_close_time: string;
  actual_close_time?: string;
  type: QuestionType;
  // Multiple-choice only
  options?: string[];
  group_variable?: string;
  group_rank?: number;
  // Continuous only
  scaling: Scaling;
  open_lower_bound: boolean | null;
  open_upper_bound: boolean | null;
  // Discrete only
  inbound_outcome_count: number | null;
  // Other
  resolution: Resolution | null;
  include_bots_in_aggregates: boolean;
  question_weight: number;
  default_score_type: ScoreType;
  default_aggregation_method: AggregationMethod;
  fine_print: string | null;
  resolution_criteria: string | null;
  label: string;
  unit: string;
  author_username: string;
  post_id: number;
  display_divergences?: number[][];
  aggregations: Aggregations;
  my_forecasts?: UserForecastHistory;
  // Used for GroupOfQuestions
  status?: QuestionStatus;
  // used for prediction flow in tournament
  my_forecast?: {
    latest: UserForecast;
    lifetime_elapsed: number;
    movement: null | CPMovement;
  };
  average_coverage?: number | null;
  coherence_links?: FetchedCoherenceLinks["data"];
  coherence_link_aggregations?: FetchedAggregateCoherenceLinks["data"];
};

export enum MovementDirection {
  UP = "up",
  DOWN = "down",
  EXPANDED = "expanded",
  CONTRACTED = "contracted",
  // safety values that we should never use
  UNCHANGED = "unchanged",
  CHANGED = "changed",
}

export type EditableQuestionFields = Pick<
  Question,
  | "title"
  | "description"
  | "options"
  | "group_variable"
  | "group_rank"
  | "scaling"
  | "resolution"
  | "include_bots_in_aggregates"
  | "question_weight"
  | "fine_print"
  | "resolution_criteria"
  | "label"
  | "unit"
  | "post_id"
  | "display_divergences"
  | "open_lower_bound"
  | "open_upper_bound"
  | "inbound_outcome_count"
  | "status"
  | "type"
>;

export type QuestionDraft = Partial<EditableQuestionFields> & {
  lastModified: number;
  categories?: Category[];
  default_project?: number;
  subQuestions?: QuestionWithForecasts[]; // Group form
  condition?: QuestionWithForecasts | null;
  condition_child?: QuestionWithForecasts | null;
  condition_id?: string;
  condition_child_id?: string;
};

export type QuestionWithNumericForecasts = Question & {
  type:
    | QuestionType.Binary
    | QuestionType.Numeric
    | QuestionType.Date
    | QuestionType.Discrete;
  forecasts: NumericForecast;
  open_lower_bound?: boolean;
  open_upper_bound?: boolean;
};
export type QuestionWithMultipleChoiceForecasts = Question & {
  type: QuestionType.MultipleChoice;
  forecasts: MultipleChoiceForecast;
  options: string[];
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
  scaling: Scaling;
  status: QuestionStatus;
  open_lower_bound: boolean | null;
  open_upper_bound: boolean | null;
  inbound_outcome_count: number | null;
  open_time: string;
  options: string[] | null;
  post_id: number;
  resolution: string | null;
  resolution_criteria: string;
  resolution_set_time: string | null;
  scheduled_close_time: string;
  scheduled_resolve_time: string;
  title: string;
  short_title: string;
  type: QuestionType;
  unit?: string;
  forecasters_count?: number | null;
};

export enum CurveQuestionLabels {
  question = "your forecast",
  crowdMedian = "your forecast of crowd median",
}

export type CurveChoiceOption = {
  id: number;
  forecast: number | null;
  status: QuestionStatus | undefined;
  label: string;
  isDirty: boolean;
};

export type ForecastAvailability = {
  isEmpty: boolean;
  cpRevealsOn: string | null;
};
