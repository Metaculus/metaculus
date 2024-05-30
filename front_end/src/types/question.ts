export enum QuestionType {
  Numeric = "numeric",
  Date = "date",
  Binary = "binary",
  MultipleChoice = "multiple_choice",
}

export enum QuestionStatus {
  Opens = "opens",
  Closes = "closes",
  Resolves = "resolves",
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
  [value_choice_n: string]: number[];
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
};

type QuestionWithNumericForecasts = Question & {
  type: QuestionType.Numeric | QuestionType.Date | QuestionType.Binary;
  forecasts: NumericForecast;
};
type QuestionWithMultipleChoiceForecasts = Question & {
  type: QuestionType.MultipleChoice;
  forecasts: MultipleChoiceForecast;
};
export type QuestionWithForecasts =
  | QuestionWithNumericForecasts
  | QuestionWithMultipleChoiceForecasts;
