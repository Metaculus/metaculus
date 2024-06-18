export type ChoiceItem = {
  choice: string;
  timestamps?: number[];
  values: number[];
  color: {
    DEFAULT: string;
    dark: string;
  };
  active: boolean;
  highlighted: boolean;
};

export type ChoiceTooltipItem = {
  color: {
    DEFAULT: string;
    dark: string;
  };
  choiceLabel: string;
  valueLabel: string;
};
