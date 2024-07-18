import { format, startOfYear } from "date-fns";

import { CategoryKey, LeaderboardType } from "@/types/scoring";

export function getLeaderboardTimeInterval(
  year: string,
  duration: string
): { startTime: string; endTime: string } {
  const yearNumber = Number(year);
  const durationNumber = Number(duration);
  const dateFormat = "yyyy-MM-dd";

  if (durationNumber === 1) {
    const startDate = startOfYear(new Date(year));
    // BE expects the first day of the next year from the interval
    // e.g. 2022 - 2023 => 2022-01-01 to 2024-01-01
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
  start_year: number
): LeaderboardType | null {
  switch (categoryKey) {
    case "comments":
      return "comment_insight";
    case "questionWriting":
      return "question_writing";
    case "baseline":
      return "baseline_global";
    case "peer": {
      return start_year < 2024 ? "peer_global_legacy" : "peer_global";
    }
    default:
      return null;
  }
}

export function getPeriodLabel(year: string, duration: string) {
  return duration === "1"
    ? year
    : `${Number(year) - (Number(duration) - 1)} - ${year}`;
}
