export type ChoiceItem = {
  choice: string;
  values: number[];
  color: string;
  active: boolean;
  highlighted: boolean;
};

export type ChoiceTooltipItem = {
  color: string;
  choiceLabel: string;
  valueLabel: string;
};
