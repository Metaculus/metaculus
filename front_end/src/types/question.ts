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
export enum NumericQuestionType {
  Binary = "binary",
  Numeric = "numeric",
  Discrete = "discrete",
  Date = "date",
}
export enum MultipleChoiceQuestionType {
  MultipleChoice = "multiple_choice",
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
  CpRevealTimeDesc = "-cp_reveal_time",
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

export type NumericForecast = {
  question_id: number;
  start_time: number;
  end_time: number | null;
  forecast_values: number[];
  interval_lower_bounds: number[] | null;
  centers: number[] | null;
  interval_upper_bounds: number[] | null;
};

export type MultipleChoiceForecast = {
  question_id: number;
  start_time: number;
  end_time: number | null;
  forecast_values: (number | null)[];
  interval_lower_bounds: (number | null)[] | null;
  centers: (number | null)[] | null;
  interval_upper_bounds: (number | null)[] | null;
};

export type Forecast = NumericForecast | MultipleChoiceForecast;

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

export type NumericUserForecast = NumericForecast & {
  distribution_input: DistributionSlider | DistributionQuantile | null;
};

export type MultipleChoiceUserForecast = MultipleChoiceForecast & {
  distribution_input: DistributionSlider | DistributionQuantile | null;
};

export type UserForecast = NumericUserForecast | MultipleChoiceUserForecast;

export type NumericUserForecastHistory = {
  history: NumericUserForecast[];
  latest?: NumericUserForecast;
  score_data?: ScoreData;
};

export type MultipleChoiceUserForecastHistory = {
  history: MultipleChoiceUserForecast[];
  latest?: MultipleChoiceUserForecast;
  score_data?: ScoreData;
};

export type UserForecastHistory =
  | NumericUserForecastHistory
  | MultipleChoiceUserForecastHistory;

export type NumericAggregateForecast = NumericForecast & {
  method: AggregationMethod;
  forecaster_count: number;
  means: number[] | null;
  histogram: number[][] | null;
  forecast_values: number[] | null;
};

export type MultipleChoiceAggregateForecast = MultipleChoiceForecast & {
  method: AggregationMethod;
  forecaster_count: number;
  means: number[] | null;
  histogram: number[][] | null;
  forecast_values: number[] | null;
};
export type AggregateForecast =
  | NumericAggregateForecast
  | MultipleChoiceAggregateForecast;

export type NumericAggregateForecastHistory = {
  history: NumericAggregateForecast[];
  latest?: NumericAggregateForecast;
  score_data?: ScoreData;
  movement?: CPMovement | null;
};

export type MultipleChoiceAggregateForecastHistory = {
  history: MultipleChoiceAggregateForecast[];
  latest?: MultipleChoiceAggregateForecast;
  score_data?: ScoreData;
  movement?: CPMovement | null;
};

export type AggregateForecastHistory =
  | NumericAggregateForecastHistory
  | MultipleChoiceAggregateForecastHistory;

export type NumericAggregations = {
  recency_weighted: NumericAggregateForecastHistory;
  unweighted: NumericAggregateForecastHistory;
  single_aggregation: NumericAggregateForecastHistory;
  metaculus_prediction: NumericAggregateForecastHistory;
};

export type MultipleChoiceAggregations = {
  recency_weighted: MultipleChoiceAggregateForecastHistory;
  unweighted: MultipleChoiceAggregateForecastHistory;
  single_aggregation: MultipleChoiceAggregateForecastHistory;
  metaculus_prediction: MultipleChoiceAggregateForecastHistory;
};

export type Aggregations = NumericAggregations | MultipleChoiceAggregations;

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
  options_history?: [string, string[]][];
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
  // Used for GroupOfQuestions
  status?: QuestionStatus;
  // Other
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
  open_lower_bound?: boolean;
  open_upper_bound?: boolean;
  aggregations: NumericAggregations;
  my_forecasts?: NumericUserForecastHistory;
  // used for prediction flow in tournament
  my_forecast?: {
    latest: NumericUserForecast;
    lifetime_elapsed: number;
    movement: null | CPMovement;
  };
};
export type QuestionWithMultipleChoiceForecasts = Question & {
  type: QuestionType.MultipleChoice;
  options: string[];
  aggregations: MultipleChoiceAggregations;
  my_forecasts?: MultipleChoiceUserForecastHistory;
  // used for prediction flow in tournament
  my_forecast?: {
    latest: MultipleChoiceUserForecast;
    lifetime_elapsed: number;
    movement: null | CPMovement;
  };
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

// TODO: is this type needed?
export type MultipleChoiceAggregationQuestion = {
  actual_close_time: string | null;
  actual_resolve_time: string | null;
  aggregations: MultipleChoiceAggregations;
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
  type: QuestionType.MultipleChoice;
  unit?: string;
  forecasters_count?: number | null;
};

export type NumericAggregationQuestion = {
  actual_close_time: string | null;
  actual_resolve_time: string | null;
  aggregations: NumericAggregations;
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
  type:
    | QuestionType.Binary
    | QuestionType.Numeric
    | QuestionType.Date
    | QuestionType.Discrete;
  unit?: string;
  forecasters_count?: number | null;
};

export type AggregationQuestion =
  | NumericAggregationQuestion
  | MultipleChoiceAggregationQuestion;

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
