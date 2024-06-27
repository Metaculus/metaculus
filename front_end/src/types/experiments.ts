export enum MapType {
  US = "us",
  Other = "other",
}

export type BaseMapArea = {
  name: string;
  abbreviation: string;
  x_adjust: number;
  y_adjust: number;
};

export type ElectionsExperimentMapArea = BaseMapArea & {
  votes: number;
  democratProbability: number;
};
