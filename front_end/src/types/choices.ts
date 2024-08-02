import { Resolution } from "@/types/post";
import { ThemeColor } from "@/types/theme";

export type ChoiceItem = {
  choice: string;
  timestamps?: number[];
  values: number[];
  minValues?: number[];
  maxValues?: number[];
  color: ThemeColor;
  active: boolean;
  highlighted: boolean;
  resolution?: Resolution | null;
  displayedResolution?: Resolution | null;
  rangeMin?: number | null;
  rangeMax?: number | null;
};

export type UserChoiceItem = {
  choice: string;
  timestamps?: number[];
  values?: number[];
  color: ThemeColor;
};

export type ChoiceTooltipItem = {
  color: ThemeColor;
  choiceLabel: string;
  valueLabel: string;
};
