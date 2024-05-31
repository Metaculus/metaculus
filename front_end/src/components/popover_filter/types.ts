export enum FilterOptionType {
  MultiChip = "multi_chip",
  ToggleChip = "toggle_chip",
  Select = "select",
}

export type FilterOption = {
  label: string;
  active: boolean;
  value: string;
};

export type FilterSection = {
  id: string;
  title: string;
  options: FilterOption[];
  type: FilterOptionType;
};
