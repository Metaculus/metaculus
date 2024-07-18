import { CategoryKey } from "@/types/scoring";

export const LEADERBOARD_CATEGORIES = [
  "baseline",
  "peer",
  "comments",
  "questionWriting",
  "tournament",
  "all",
] as const;
export const DEFAULT_LEADERBOARD_CATEGORY: CategoryKey = "all";

const LEADERBOARD_YEARS = [
  "2025,10",
  "2025,5",
  "2020,5",
  "2025,2",
  "2024,1",
  "2023,2",
  "2023,1",
  "2022,1",
  "2021,2",
  "2021,1",
  "2020,1",
  "2019,2",
  "2019,1",
  "2018,1",
  "2017,2",
  "2017,1",
  "2016,1",
];
export const LEADERBOARD_YEAR_OPTIONS = LEADERBOARD_YEARS.map((opt) => {
  const [year, duration] = opt.split(",");
  return { year, duration };
});
