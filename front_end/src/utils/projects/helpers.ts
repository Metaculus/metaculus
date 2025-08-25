import {
  DefaultIndexData,
  IndexData,
  MultiYearIndexData,
} from "@/types/projects";

export const isMultiYearIndexData = (
  d: IndexData | null | undefined
): d is MultiYearIndexData => !!d && d.type === "multi_year";

export const isDefaultIndexData = (
  d: IndexData | null | undefined
): d is DefaultIndexData => !!d && (d.type === "default" || !d.type);
