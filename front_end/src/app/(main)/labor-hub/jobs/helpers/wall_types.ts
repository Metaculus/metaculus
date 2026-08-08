import type { JobDefinition } from "../../data";

export const WALL_YEARS = ["2027", "2030", "2035"] as const;
export type WallYear = (typeof WALL_YEARS)[number];

export type WallJob = Pick<JobDefinition, "name" | "slug"> & {
  forecasts: Record<WallYear, number | null>;
};
