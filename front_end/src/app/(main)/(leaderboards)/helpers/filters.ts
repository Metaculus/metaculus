import { CategoryKey, LeaderboardType } from "@/types/scoring";

export function getLeaderboardTimeInterval(
  year: string,
  duration: string
): { startTime: string; endTime: string } {
  return {
    startTime: year + "-01-01",
    endTime: `${Number(year) + Number(duration)}` + "-01-01",
  };
}

export function mapCategoryKeyToLeaderboardType(
  categoryKey: CategoryKey,
  end_year: number
): LeaderboardType | null {
  switch (categoryKey) {
    case "comments":
      return "comment_insight";
    case "questionWriting":
      return "question_writing";
    case "baseline":
      return "baseline_global";
    case "peer": {
      return end_year <= 2024 ? "peer_global_legacy" : "peer_global";
    }
    default:
      return null;
  }
}

export function getPeriodLabel(year: string, duration: string) {
  return duration === "1"
    ? year
    : `${year}-${Number(year.slice(2)) + (Number(duration) - 1)}`;
}
