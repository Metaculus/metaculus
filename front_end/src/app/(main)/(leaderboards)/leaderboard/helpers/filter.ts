import { useTranslations } from "next-intl";

import { SearchParams } from "@/types/navigation";
import {
  CategoryKey,
  LeaderboardFilter,
  LeaderboardFilters,
} from "@/types/scoring";

import { getPeriodLabel } from "../../helpers/filters";
import {
  SCORING_CATEGORY_FILTER,
  SCORING_DURATION_FILTER,
  SCORING_YEAR_FILTER,
} from "../../search_params";
import {
  DEFAULT_LEADERBOARD_CATEGORY,
  LEADERBOARD_YEAR_OPTIONS,
} from "../filters";

const getLeaderboardTimePeriodFilters = (
  duration: string
): LeaderboardFilter[] => {
  return LEADERBOARD_YEAR_OPTIONS.filter((opt) => opt.duration === duration)
    .map((opt) => opt.year)
    .sort()
    .map((year) => ({
      label: getPeriodLabel(year, duration),
      value: year,
    }));
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

export function extractLeaderboardFiltersFromParams(
  params: SearchParams,
  t: ReturnType<typeof useTranslations>
): LeaderboardFilters {
  const category = (params[SCORING_CATEGORY_FILTER] ??
    DEFAULT_LEADERBOARD_CATEGORY) as CategoryKey;

  const durations = getLeaderboardDurationFilters(t);
  let duration: string = durations[0]?.value ?? "1";
  if (
    params[SCORING_DURATION_FILTER] &&
    typeof params[SCORING_DURATION_FILTER] === "string" &&
    !isNaN(Number(params[SCORING_DURATION_FILTER]))
  ) {
    duration = params[SCORING_DURATION_FILTER];
  }

  const periods = getLeaderboardTimePeriodFilters(duration);
  // Get the earliest non-finalized year as default
  const gracePeriod = 100; // 100 days
  const currentDate = new Date();
  let year = new Date(currentDate.getTime() - gracePeriod * 24 * 60 * 60 * 1000)
    .getFullYear()
    .toString();
  // if year is not in periods, fall back to the latest period
  if (!periods.find((p) => p.value === year)) {
    year = periods[periods.length - 1]?.value ?? "2025";
  }
  if (
    params[SCORING_YEAR_FILTER] &&
    typeof params[SCORING_YEAR_FILTER] === "string" &&
    !isNaN(Number(params[SCORING_YEAR_FILTER]))
  ) {
    year = params[SCORING_YEAR_FILTER];
  }

  return { category, durations, duration, periods, year };
}
