import { cache } from "react";

import {
  fetchJobsData,
  getJobValueForYear,
} from "@/app/(main)/labor-hub/helpers/fetch_jobs_data";

import { JOBS_DATA } from "../../data";

import { WALL_YEARS, type WallJob, type WallYear } from "./wall_types";

export { WALL_YEARS, type WallJob, type WallYear };

export const fetchWallData = cache(async (): Promise<WallJob[]> => {
  const { jobs } = await fetchJobsData();
  const bySlug = new Map(JOBS_DATA.map((j) => [j.post_id, j.slug]));

  return jobs.map((job) => {
    const forecasts = Object.fromEntries(
      WALL_YEARS.map((year) => [year, getJobValueForYear(job, year)])
    ) as Record<WallYear, number | null>;
    return {
      name: job.name,
      slug: bySlug.get(job.post_id) ?? "",
      forecasts,
    };
  });
});
