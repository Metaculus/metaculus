export enum MapType {
  US = "us",
  Other = "other",
}

export type BaseExperimentBar = {
  id: string;
  name: string;
  value: number;
};

export type ByStateExperimentBar = BaseExperimentBar & {
  abbreviation: string;
  democratProbability: number;
  hasQuestion: boolean;
};

export type BaseMapArea = {
  name: string;
  abbreviation: string;
  x_adjust: number;
  y_adjust: number;
};

export type StateByForecastItem = BaseMapArea & {
  votes: number;
  democratProbability: number;
  link?: {
    groupId: number;
    questionId: number;
  };
  forecastersNumber?: number;
  forecastsNumber?: number;
};
