import { Resolution } from "@/types/post";
import { ThemeColor } from "@/types/theme";

import { Scaling } from "./question";

export type ChoiceItem = {
  id?: number;
  choice: string;
  timestamps?: number[];
  closeTime?: number;
  values: number[];
  minValues?: number[];
  maxValues?: number[];
  forecastersCount?: number[];
  color: ThemeColor;
  active: boolean;
  highlighted: boolean;
  resolution?: Resolution | null;
  displayedResolution?: Resolution | null;
  rangeMin?: number | null;
  rangeMax?: number | null;
  scaling?: Scaling;
};

export type UserChoiceItem = {
  choice: string;
  timestamps?: number[];
  values?: number[];
  color: ThemeColor;
  unscaledValues?: number[]; // This array is needed to display the correct value for the continuous group in the chart tooltip
};

export type ChoiceTooltipItem = {
  color: ThemeColor;
  choiceLabel: string;
  valueLabel: string;
};
