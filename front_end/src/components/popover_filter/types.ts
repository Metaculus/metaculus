import { ChipColor } from "@/components/ui/chip";

export enum FilterOptionType {
  MultiChip = "multi_chip",
  ToggleChip = "toggle_chip",
  Combobox = "combobox",
}

export type FilterOption = {
  label: string;
  active: boolean;
  value: string;
};

type BaseFilterSection = {
  id: string;
  title: string;
  options: FilterOption[];
};

type ComboboxFilterSection = BaseFilterSection & {
  type: FilterOptionType.Combobox;
  chipColor?: ChipColor;
  chipFormat?: (value: string) => string;
  shouldEnforceSearch?: boolean;
};

type OtherFilterSection = BaseFilterSection & {
  type: FilterOptionType.MultiChip | FilterOptionType.ToggleChip;
};

export type FilterSection = ComboboxFilterSection | OtherFilterSection;
