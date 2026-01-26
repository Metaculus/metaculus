import { ReactNode } from "react";

import { Resolution } from "@/types/post";
import { ThemeColor } from "@/types/theme";

import { Scaling } from "./question";

export type ChoiceItem = {
  id?: number;
  choice: string; // multiple choice option or subquestion label
  label?: string; // label to display if different from "choice"
  color: ThemeColor;
  highlighted: boolean;
  active: boolean;
  resolution: Resolution | null;
  displayedResolution?: Resolution | null;
  closeTime?: number; // group only
  unit?: string; // group only
  rangeMin?: number | null; // continuous group only
  rangeMax?: number | null; // continuous group only
  scaling?: Scaling; // continuous group only
  aggregationTimestamps: number[];
  aggregationValues: (number | null)[];
  aggregationMinValues: (number | null)[];
  aggregationMaxValues: (number | null)[];
  aggregationForecasterCounts: number[];
  userTimestamps: number[];
  userValues: (number | null)[];
  actual_resolve_time?: string | null;
  userMinValues?: (number | null)[]; // continuous group only
  userMaxValues?: (number | null)[]; // continuous group only
};

export type UserChoiceItem = {
  choice: string;
  timestamps?: number[];
  values?: (number | null)[];
  color: ThemeColor;
  unscaledValues?: number[]; // This array is needed to display the correct value for the continuous group in the chart tooltip
};

export type ChoiceTooltipItem = {
  color?: ThemeColor;
  choiceLabel: string;
  valueElement: ReactNode;
};
