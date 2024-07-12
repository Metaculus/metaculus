import {
  addDays,
  format,
  isWithinInterval,
  startOfDay,
  startOfYear,
} from "date-fns";
import { useTranslations } from "next-intl";

import { SearchParams } from "@/types/navigation";
import {
  CategoryKey,
  LeaderboardFilter,
  LeaderboardFilters,
  LeaderboardType,
} from "@/types/scoring";

import {
  DEFAULT_LEADERBOARD_CATEGORY,
  LEADERBOARD_CATEGORY_FILTER,
  LEADERBOARD_DURATION_FILTER,
  LEADERBOARD_YEAR_FILTER,
  LEADERBOARD_YEAR_OPTIONS,
} from "../filters";

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

export function extractLeaderboardFiltersFromParams(
  params: SearchParams,
  t: ReturnType<typeof useTranslations>
): LeaderboardFilters {
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

export function getLeaderboardTimeInterval(
  year: string,
  duration: string
): { startTime: string; endTime: string } {
  const yearNumber = Number(year);
  const durationNumber = Number(duration);
  const dateFormat = "yyyy-MM-dd";

  if (durationNumber === 1) {
    const startDate = startOfYear(new Date(year));
    const end = startOfYear(new Date(`${yearNumber + 1}`));

    return {
      startTime: format(startDate, dateFormat),
      endTime: format(end, dateFormat),
    };
  }

  const start = startOfYear(new Date(`${yearNumber - durationNumber + 1}`));
  const end = startOfYear(new Date(`${yearNumber + 1}`));

  return {
    startTime: format(start, dateFormat),
    endTime: format(end, dateFormat),
  };
}

export function mapCategoryKeyToLeaderboardType(
  categoryKey: CategoryKey,
  startTime: string,
  endTime: string
): LeaderboardType | null {
  switch (categoryKey) {
    case "comments":
      return "comment_insight";
    case "questionWriting":
      return "question_writing";
    case "baseline":
      return "baseline_global";
    case "peer": {
      const isLegacy = !isWithinInterval(
        addDays(startOfDay(new Date("2024")), 1),
        {
          start: new Date(startTime),
          end: new Date(endTime),
        }
      );
      return isLegacy ? "peer_global_legacy" : "peer_global";
    }
    default:
      return null;
  }
}
