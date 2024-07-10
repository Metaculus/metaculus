import { useTranslations } from "next-intl";

import { SearchParams } from "@/types/navigation";

import {
  CategoryKey,
  DEFAULT_LEADERBOARD_CATEGORY,
  LEADERBOARD_CATEGORY_FILTER,
  LEADERBOARD_DURATION_FILTER,
  LEADERBOARD_YEAR_FILTER,
  LEADERBOARD_YEAR_OPTIONS,
} from "../constants/filters";

type LeaderboardFilter = {
  label: string;
  value: string;
};

const getLeaderboardTimePeriodFilters = (
  duration: string
): LeaderboardFilter[] => {
  return LEADERBOARD_YEAR_OPTIONS.filter((opt) => opt.duration === duration)
    .map((opt) => opt.year)
    .sort()
    .map((year) =>
      duration === "1"
        ? {
            label: year,
            value: year,
          }
        : {
            label: `${Number(year) - (Number(duration) - 1)} - ${year}`,
            value: year,
          }
    );
};

const getLeaderboardDurationFilters = (
  t: ReturnType<typeof useTranslations>
): LeaderboardFilter[] => {
  const uniqueDurations = new Set(
    LEADERBOARD_YEAR_OPTIONS.map((item) => Number(item.duration))
  );

  return Array.from(uniqueDurations)
    .sort((a, b) => a - b)
    .map((dur) =>
      dur === 1
        ? { label: `${dur} ${t("year")}`, value: String(dur) }
        : { label: `${dur} ${t("years")}`, value: String(dur) }
    );
};

export type LeaderboardFilters = ReturnType<
  typeof extractLeaderboardFiltersFromParams
>;
export function extractLeaderboardFiltersFromParams(
  params: SearchParams,
  t: ReturnType<typeof useTranslations>
) {
  const category = (params[LEADERBOARD_CATEGORY_FILTER] ??
    DEFAULT_LEADERBOARD_CATEGORY) as CategoryKey;

  const durations = getLeaderboardDurationFilters(t);
  let duration: string = durations[0].value;
  if (
    params[LEADERBOARD_DURATION_FILTER] &&
    typeof params[LEADERBOARD_DURATION_FILTER] === "string" &&
    !isNaN(Number(params[LEADERBOARD_DURATION_FILTER]))
  ) {
    duration = params[LEADERBOARD_DURATION_FILTER];
  }

  const periods = getLeaderboardTimePeriodFilters(duration);
  let year: string = periods[periods.length - 1].value;
  if (
    params[LEADERBOARD_YEAR_FILTER] &&
    typeof params[LEADERBOARD_YEAR_FILTER] === "string" &&
    !isNaN(Number(params[LEADERBOARD_YEAR_FILTER]))
  ) {
    year = params[LEADERBOARD_YEAR_FILTER];
  }

  return { category, durations, duration, periods, year };
}
