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
