import { ChipColor } from "@/components/ui/chip";

export enum FilterOptionType {
  MultiChip = "multi_chip",
  ToggleChip = "toggle_chip",
  Combobox = "combobox",
}

export type FilterOption = {
  id?: string;
  label: string;
  active: boolean;
  value: string;
  // currently only supported by FilterOptionType.ToggleChip type
  // TODO: revisit popup component to have more scalable solution for allowing multiple filters per option
  extraValues?: Record<string, string>;
};

export type ToggleFilterOption = FilterOption & {
  // TODO: consider deprecating FilterOptionType.MultiChip and refactoring related filters to FilterOptionType.ToggleChip, where all options are persisted
  // make specific option of FilterOptionType.ToggleChip section to work similar to FilterOptionType.MultiChip
  // when option is not cleared after selecting another one from the same section
  isPersisted?: boolean;
};

type BaseFilterSection = {
  id: string;
  title: string;
  options: FilterOption[];
};

type ComboboxFilterSection = Omit<BaseFilterSection, "options"> & {
  type: FilterOptionType.Combobox;
  chipColor?: ChipColor;
  chipFormat?: (value: string) => string;
  shouldEnforceSearch?: boolean;
  options: FilterOption[];
  optionsFetcher?: (query: string) => Promise<FilterOption[]>;
  multiple?: boolean;
};

type ToggleChipFilterSection = BaseFilterSection & {
  type: FilterOptionType.ToggleChip;
  options: ToggleFilterOption[];
};

type MultiChipFilterSection = BaseFilterSection & {
  type: FilterOptionType.MultiChip;
};

export type FilterSection =
  | ComboboxFilterSection
  | ToggleChipFilterSection
  | MultiChipFilterSection;

export type FilterReplaceInfo = { optionId: string; replaceIds: string[] };
