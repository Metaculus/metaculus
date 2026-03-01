import { DEFAULT_VISIBLE_CHOICES_COUNT } from "@/constants/questions";

export const getMaxVisibleCheckboxes = (embedMode: boolean): number => {
  if (!embedMode) return DEFAULT_VISIBLE_CHOICES_COUNT;
  return 4;
};
